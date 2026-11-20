import { createHash } from "node:crypto";
import { COUNTRIES, COUNTRY_INFO, WINDOW_HOURS, type Country, type Topic } from "@/lib/config";
import type { Coverage, RawItem, Story, TrendingSearch } from "@/lib/types";
import { THEME_BY_ID, type ThemeId } from "@/lib/profile";
import { matchThemes } from "./affinity";
import { clusterBy, sameStory } from "./cluster";
import { isExcluded } from "./exclusion";
import { findSpanishOutlet, outletIdOf } from "./outlets";
import { tokenize } from "./text";
import { classifyTopic } from "./topics";
import { coverageScore, freshnessScore, positionScore, trendScore, viralScore } from "./virality";

const HOUR_MS = 3_600_000;

/** Una historia ya guardada, para reutilizar su id y no perder su historial. */
export type KnownStory = { id: string; country: Country; title: string };

type TaggedItem = RawItem & { topic: Topic | null };

const themeTopic = (item: RawItem): Topic | null => {
  const [first] = matchThemes(item.title, COUNTRY_INFO[item.country].lang);
  return first ? THEME_BY_ID[first].topic : null;
};

const tagTopic = (item: RawItem): TaggedItem => ({
  ...item,
  topic: item.topicHint ?? classifyTopic(item.title) ?? themeTopic(item),
});

/** Temas del perfil de toda la historia: los de cualquiera de sus titulares, ordenados por frecuencia. */
const storyThemes = (members: readonly TaggedItem[], country: Country): ThemeId[] => {
  const counts = new Map<ThemeId, number>();
  for (const item of members)
    for (const theme of matchThemes(item.title, COUNTRY_INFO[country].lang)) counts.set(theme, (counts.get(theme) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([theme]) => theme);
};

const relevance = (item: RawItem): number => positionScore(item.feedPosition, item.feedSize);

const toCoverage = (item: RawItem): Coverage => {
  const known = item.country === "ES" ? findSpanishOutlet(item.sourceDomain, item.sourceName) : null;
  return {
    outletId: outletIdOf(item.sourceDomain, item.sourceName),
    name: known?.name ?? item.sourceName,
    domain: item.sourceDomain,
    url: item.url,
    publishedAt: item.publishedAt,
  };
};

const uniqueByOutlet = (items: readonly TaggedItem[]): Coverage[] => {
  const byOutlet = new Map<string, Coverage>();
  for (const item of items) {
    const coverage = toCoverage(item);
    const current = byOutlet.get(coverage.outletId);
    if (!current || coverage.publishedAt < current.publishedAt) byOutlet.set(coverage.outletId, coverage);
  }
  return [...byOutlet.values()].sort((a, b) => a.publishedAt - b.publishedAt);
};

const majorityTopic = (items: readonly TaggedItem[]): Topic | null => {
  const counts = new Map<Topic, number>();
  for (const item of items) if (item.topic) counts.set(item.topic, (counts.get(item.topic) ?? 0) + 1);
  const [winner] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return winner?.[0] ?? null;
};

const newId = (country: Country, title: string): string =>
  createHash("sha1").update(`${country}:${tokenize(title).sort().join(" ")}`).digest("hex").slice(0, 12);

const idFor = (country: Country, title: string, known: readonly KnownStory[]): string => {
  const tokens = new Set(tokenize(title));
  const match = known.find((story) => story.country === country && sameStory(new Set(tokenize(story.title)), tokens));
  return match?.id ?? newId(country, title);
};

const buildStory = (
  members: readonly TaggedItem[],
  country: Country,
  trends: readonly TrendingSearch[],
  known: readonly KnownStory[],
  now: number,
): Story | null => {
  const topic = majorityTopic(members);
  if (!topic) return null;

  const lead = [...members].filter((item) => item.topic === topic).sort((a, b) => relevance(b) - relevance(a))[0];
  if (!lead) return null;

  const coverage = uniqueByOutlet(members);
  const firstPublisher = coverage[0] ?? toCoverage(lead);
  const firstSeenAt = Math.min(...members.map((item) => item.publishedAt));
  const trend = trendScore(lead.title, trends.filter((t) => t.country === country));
  const breakdown = {
    coverage: coverageScore(coverage.length),
    trend: trend.score,
    freshness: freshnessScore(firstSeenAt, now),
    position: Math.max(...members.filter((item) => item.topicHint).map(relevance), 0),
  };

  return {
    id: idFor(country, lead.title, known),
    country,
    topic,
    title: lead.title,
    url: lead.url,
    outlet: toCoverage(lead),
    firstPublisher,
    coverage,
    firstSeenAt,
    score: viralScore(breakdown),
    breakdown,
    matchedTrend: trend.query,
    themes: storyThemes(members, country),
  };
};

/**
 * De titulares sueltos a historias puntuadas. Función pura: sin red ni base de datos.
 * Excluye política y deportes antes de agrupar, así que una historia nunca hereda
 * cobertura de un titular excluido.
 */
export const processItems = (
  items: readonly RawItem[],
  trends: readonly TrendingSearch[],
  known: readonly KnownStory[],
  now: number,
): Story[] => {
  const windowStart = now - WINDOW_HOURS * HOUR_MS;
  const usable = items
    .filter((item) => item.publishedAt >= windowStart)
    .map(tagTopic)
    .filter((item) => !isExcluded(item.title, item.topic))
    .sort((a, b) => relevance(b) - relevance(a));

  return COUNTRIES.flatMap((country) =>
    clusterBy(
      usable.filter((item) => item.country === country),
      (item) => item.title,
    ).flatMap(({ members }) => {
      const story = buildStory(members, country, trends, known, now);
      return story && !isExcluded(story.title, story.topic) ? [story] : [];
    }),
  ).sort((a, b) => b.score - a.score);
};
