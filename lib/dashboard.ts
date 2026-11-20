import {
  COUNTRIES,
  ES_OUTLETS,
  OTHER_OUTLET_ID,
  TOPICS,
  WINDOW_HOURS,
  type Country,
  type Topic,
} from "@/lib/config";
import { fitsProfile } from "@/lib/classify/affinity";
import { isExcluded } from "@/lib/classify/exclusion";
import type { Filters } from "@/lib/filters";
import { THEMES, type ThemeId } from "@/lib/profile";
import { getMeta, historyFor, isDemo, latestTrends, listCurrentStories, listDigests } from "@/lib/db/repository";
import type { DigestRecord, Story, StoryWithHistory, TrendingSearch } from "@/lib/types";

const HOUR_MS = 3_600_000;
const STORY_LIMIT = 40;

export type HeatCell = { country: Country; topic: Topic; top: number; count: number; leader: string | null };

export type OutletRow = { id: string; name: string; stories: number; firsts: number; avgScore: number };

export type ThemeCount = { id: ThemeId; label: string; count: number };

export type Dashboard = {
  lastIngest: number | null;
  demo: boolean;
  filters: Filters;
  /** Historias vigentes que encajan en el perfil y total sin filtrar. */
  profileCount: number;
  allCount: number;
  themes: ThemeCount[];
  heat: HeatCell[];
  stories: StoryWithHistory[];
  totalStories: number;
  spainOutlets: OutletRow[];
  trends: Record<Country, TrendingSearch[]>;
  digests: DigestRecord[];
};

/** Puntuación máxima por hora durante las últimas 24 h (null = no estaba en el radar). */
export const hourlyHeat = (points: StoryWithHistory["history"], now: number): Array<number | null> =>
  Array.from({ length: WINDOW_HOURS }, (_, index) => {
    const start = now - (WINDOW_HOURS - index) * HOUR_MS;
    const inHour = points.filter((p) => p.at > start && p.at <= start + HOUR_MS);
    return inHour.length === 0 ? null : Math.max(...inHour.map((p) => p.score));
  });

const withHistory = (stories: Story[], now: number): StoryWithHistory[] => {
  const history = historyFor(
    stories.map((s) => s.id),
    now - WINDOW_HOURS * HOUR_MS,
  );
  return stories.map((story) => {
    const points = history.get(story.id) ?? [];
    const hourAgo = [...points].reverse().find((p) => p.at <= now - HOUR_MS);
    return { ...story, history: points, delta: hourAgo ? story.score - hourAgo.score : story.score };
  });
};

const buildHeat = (stories: Story[]): HeatCell[] =>
  COUNTRIES.flatMap((country) =>
    TOPICS.map((topic) => {
      const inCell = stories.filter((s) => s.country === country && s.topic === topic);
      const leader = inCell[0];
      return { country, topic, top: leader?.score ?? 0, count: inCell.length, leader: leader?.title ?? null };
    }),
  );

const buildSpainOutlets = (stories: Story[]): OutletRow[] => {
  const spanish = stories.filter((s) => s.country === "ES");
  const catalog = [...ES_OUTLETS.map((o) => ({ id: o.id, name: o.name })), { id: OTHER_OUTLET_ID, name: "Otros" }];
  const knownIds = new Set(ES_OUTLETS.map((o) => o.id));
  const bucketOf = (outletId: string): string => (knownIds.has(outletId) ? outletId : OTHER_OUTLET_ID);

  return catalog
    .map(({ id, name }) => {
      const covered = spanish.filter((s) => s.coverage.some((c) => bucketOf(c.outletId) === id));
      const firsts = spanish.filter((s) => bucketOf(s.firstPublisher.outletId) === id).length;
      const avgScore = covered.length === 0 ? 0 : Math.round(covered.reduce((sum, s) => sum + s.score, 0) / covered.length);
      return { id, name, stories: covered.length, firsts, avgScore };
    })
    .sort((a, b) => (a.id === OTHER_OUTLET_ID ? 1 : b.id === OTHER_OUTLET_ID ? -1 : b.stories - a.stories));
};

const buildTrends = (): Record<Country, TrendingSearch[]> => {
  const all = latestTrends().filter((t) => !isExcluded(t.query, null));
  return Object.fromEntries(COUNTRIES.map((c) => [c, all.filter((t) => t.country === c).slice(0, 8)])) as Record<
    Country,
    TrendingSearch[]
  >;
};

const buildThemeCounts = (stories: Story[]): ThemeCount[] =>
  THEMES.map((theme) => ({ id: theme.id, label: theme.label, count: stories.filter((s) => s.themes.includes(theme.id)).length }));

export const getDashboard = (filters: Filters, now = Date.now()): Dashboard => {
  const everything = listCurrentStories({}).filter((s) => !isExcluded(s.title, s.topic));
  const inProfile = everything.filter((s) => fitsProfile(s.themes));
  const all = filters.scope === "perfil" ? inProfile : everything;
  const filtered = all.filter(
    (s) =>
      (!filters.country || s.country === filters.country) &&
      (!filters.topic || s.topic === filters.topic) &&
      (!filters.theme || s.themes.includes(filters.theme)),
  );
  const forThemes = inProfile.filter(
    (s) => (!filters.country || s.country === filters.country) && (!filters.topic || s.topic === filters.topic),
  );
  const lastIngest = getMeta("last_ingest");
  return {
    lastIngest: lastIngest ? Number(lastIngest) : null,
    demo: isDemo(),
    filters,
    profileCount: inProfile.length,
    allCount: everything.length,
    themes: buildThemeCounts(forThemes),
    heat: buildHeat(filters.theme ? all.filter((s) => filters.theme !== null && s.themes.includes(filters.theme)) : all),
    stories: withHistory(filtered.slice(0, STORY_LIMIT), now),
    totalStories: filtered.length,
    spainOutlets: buildSpainOutlets(
      all.filter((s) => (!filters.topic || s.topic === filters.topic) && (!filters.theme || s.themes.includes(filters.theme))),
    ),
    trends: buildTrends(),
    digests: listDigests(6),
  };
};
