import { z } from "zod";
import { isCountry, isTopic, type Country, type Topic } from "@/lib/config";
import type { KnownStory } from "@/lib/classify/process";
import { isThemeId, type ThemeId } from "@/lib/profile";
import type { DigestRecord, HeatPoint, Story, TrendingSearch } from "@/lib/types";
import { getDb } from "./client";

const coverageSchema = z.object({
  outletId: z.string(),
  name: z.string(),
  domain: z.string().nullable(),
  url: z.string(),
  publishedAt: z.number(),
});

const payloadSchema = z.object({
  outlet: coverageSchema,
  firstPublisher: coverageSchema,
  coverage: z.array(coverageSchema),
  breakdown: z.object({ coverage: z.number(), trend: z.number(), freshness: z.number(), position: z.number() }),
  matchedTrend: z.string().nullable(),
  themes: z
    .array(z.string())
    .default([])
    .transform((list) => list.filter((t): t is ThemeId => isThemeId(t))),
});

const storyRowSchema = z.object({
  id: z.string(),
  country: z.string().refine(isCountry),
  topic: z.string().refine(isTopic),
  title: z.string(),
  url: z.string(),
  payload: z.string(),
  first_seen_at: z.number(),
  score: z.number(),
});

const toStory = (row: unknown): Story | null => {
  const parsed = storyRowSchema.safeParse(row);
  if (!parsed.success) return null;
  const { payload, first_seen_at, ...rest } = parsed.data;
  const details = payloadSchema.safeParse(JSON.parse(payload));
  if (!details.success || !isCountry(rest.country) || !isTopic(rest.topic)) return null;
  return { ...rest, country: rest.country, topic: rest.topic, firstSeenAt: first_seen_at, ...details.data };
};

/* ---------- Meta ---------- */

export const getMeta = (key: string): string | null => {
  const row = z.object({ value: z.string() }).safeParse(getDb().prepare("SELECT value FROM meta WHERE key = ?").get(key));
  return row.success ? row.data.value : null;
};

export const setMeta = (key: string, value: string): void => {
  getDb().prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
};

export const isDemo = (): boolean => getMeta("demo") === "1";

/* ---------- Escritura ---------- */

export type IngestWrite = { stories: Story[]; trends: TrendingSearch[]; at: number; demo: boolean };

export const clearAll = (): void => {
  getDb().exec("DELETE FROM stories; DELETE FROM snapshots; DELETE FROM trends; DELETE FROM meta;");
};

export const saveIngest = ({ stories, trends, at, demo }: IngestWrite): void => {
  const db = getDb();
  const upsertStory = db.prepare(`
    INSERT INTO stories (id, country, topic, title, url, payload, first_seen_at, score, updated_at)
    VALUES (@id, @country, @topic, @title, @url, @payload, @firstSeenAt, @score, @at)
    ON CONFLICT(id) DO UPDATE SET topic = excluded.topic, title = excluded.title, url = excluded.url,
      payload = excluded.payload, first_seen_at = MIN(stories.first_seen_at, excluded.first_seen_at),
      score = excluded.score, updated_at = excluded.updated_at`);
  const insertSnapshot = db.prepare("INSERT OR REPLACE INTO snapshots (story_id, at, score, coverage) VALUES (?, ?, ?, ?)");
  const insertTrend = db.prepare("INSERT INTO trends (country, query, traffic, at) VALUES (?, ?, ?, ?)");

  db.transaction(() => {
    if (!demo && isDemo()) clearAll();
    for (const story of stories) {
      const { outlet, firstPublisher, coverage, breakdown, matchedTrend, themes } = story;
      upsertStory.run({
        ...story,
        at,
        payload: JSON.stringify({ outlet, firstPublisher, coverage, breakdown, matchedTrend, themes }),
      });
      insertSnapshot.run(story.id, at, story.score, coverage.length);
    }
    if (trends.length > 0) {
      db.prepare("DELETE FROM trends").run();
      for (const trend of trends) insertTrend.run(trend.country, trend.query, trend.traffic, at);
    }
    setMeta("last_ingest", String(at));
    setMeta("demo", demo ? "1" : "0");
  })();
};

/** Borra lo que tenga más de dos días para que la base no crezca sin fin. */
export const prune = (now: number): void => {
  const cutoff = now - 48 * 3_600_000;
  const db = getDb();
  db.prepare("DELETE FROM snapshots WHERE at < ?").run(cutoff);
  db.prepare("DELETE FROM stories WHERE updated_at < ?").run(cutoff);
};

/* ---------- Lectura ---------- */

export const knownStories = (since: number): KnownStory[] =>
  z
    .array(z.object({ id: z.string(), country: z.string().refine(isCountry), title: z.string() }))
    .parse(getDb().prepare("SELECT id, country, title FROM stories WHERE updated_at >= ?").all(since))
    .flatMap((row) => (isCountry(row.country) ? [{ id: row.id, country: row.country, title: row.title }] : []));

export type StoryQuery = { since: number; country?: Country; topic?: Topic };

/** Historias vigentes: las que aparecieron en la última ingesta. */
export const listCurrentStories = ({ country, topic }: Omit<StoryQuery, "since">): Story[] => {
  const lastIngest = Number(getMeta("last_ingest") ?? 0);
  const filters: Array<[string, string]> = [];
  if (country) filters.push(["country = ?", country]);
  if (topic) filters.push(["topic = ?", topic]);
  const where = ["updated_at = ?", ...filters.map(([clause]) => clause)].join(" AND ");
  const rows = getDb()
    .prepare(`SELECT * FROM stories WHERE ${where} ORDER BY score DESC`)
    .all(lastIngest, ...filters.map(([, value]) => value));
  return rows.flatMap((row) => {
    const story = toStory(row);
    return story ? [story] : [];
  });
};

export const historyFor = (ids: readonly string[], since: number): Map<string, HeatPoint[]> => {
  const result = new Map<string, HeatPoint[]>();
  if (ids.length === 0) return result;
  const placeholders = ids.map(() => "?").join(",");
  const rows = z
    .array(z.object({ story_id: z.string(), at: z.number(), score: z.number() }))
    .parse(
      getDb()
        .prepare(`SELECT story_id, at, score FROM snapshots WHERE at >= ? AND story_id IN (${placeholders}) ORDER BY at`)
        .all(since, ...ids),
    );
  for (const row of rows) {
    const list = result.get(row.story_id) ?? [];
    list.push({ at: row.at, score: row.score });
    result.set(row.story_id, list);
  }
  return result;
};

export const latestTrends = (): TrendingSearch[] =>
  z
    .array(z.object({ country: z.string(), query: z.string(), traffic: z.number() }))
    .parse(getDb().prepare("SELECT country, query, traffic FROM trends ORDER BY traffic DESC").all())
    .flatMap((row) => (isCountry(row.country) ? [{ ...row, country: row.country }] : []));

/* ---------- Correos ---------- */

export const recordDigest = (record: Omit<DigestRecord, "id"> & { file: string | null }): void => {
  getDb()
    .prepare("INSERT INTO digests (sent_at, recipients, mode, story_count, file) VALUES (?, ?, ?, ?, ?)")
    .run(record.sentAt, record.recipients, record.mode, record.storyCount, record.file);
};

export const listDigests = (limit: number): DigestRecord[] =>
  z
    .array(
      z.object({
        id: z.number(),
        sent_at: z.number(),
        recipients: z.string(),
        mode: z.enum(["smtp", "simulado"]),
        story_count: z.number(),
      }),
    )
    .parse(getDb().prepare("SELECT id, sent_at, recipients, mode, story_count FROM digests ORDER BY sent_at DESC LIMIT ?").all(limit))
    .map((row) => ({ id: row.id, sentAt: row.sent_at, recipients: row.recipients, mode: row.mode, storyCount: row.story_count }));
