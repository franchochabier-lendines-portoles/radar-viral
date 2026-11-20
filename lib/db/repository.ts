import type { InStatement } from "@libsql/client";
import { z } from "zod";
import { isCountry, isTopic, type Country, type Topic } from "@/lib/config";
import type { KnownStory } from "@/lib/classify/process";
import { isThemeId, type ThemeId } from "@/lib/profile";
import type { DigestRecord, HeatPoint, Story, TrendingSearch } from "@/lib/types";
import { getDb } from "./client";

const HOUR_MS = 3_600_000;

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

const num = z.coerce.number();

const storyRowSchema = z.object({
  id: z.string(),
  country: z.string(),
  topic: z.string(),
  title: z.string(),
  url: z.string(),
  payload: z.string(),
  first_seen_at: num,
  score: num,
});

const toStory = (row: unknown): Story | null => {
  const parsed = storyRowSchema.safeParse(row);
  if (!parsed.success) return null;
  const { payload, first_seen_at, country, topic, ...rest } = parsed.data;
  const details = payloadSchema.safeParse(JSON.parse(payload));
  if (!details.success || !isCountry(country) || !isTopic(topic)) return null;
  return { ...rest, country, topic, firstSeenAt: first_seen_at, ...details.data };
};

const rowsOf = async (sql: string, args: Array<string | number> = []): Promise<unknown[]> => {
  const db = await getDb();
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => ({ ...row }));
};

/* ---------- Meta ---------- */

export const getMeta = async (key: string): Promise<string | null> => {
  const [row] = await rowsOf("SELECT value FROM meta WHERE key = ?", [key]);
  const parsed = z.object({ value: z.string() }).safeParse(row);
  return parsed.success ? parsed.data.value : null;
};

const setMetaStatement = (key: string, value: string): InStatement => ({
  sql: "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  args: [key, value],
});

export const setMeta = async (key: string, value: string): Promise<void> => {
  await (await getDb()).execute(setMetaStatement(key, value));
};

export const isDemo = async (): Promise<boolean> => (await getMeta("demo")) === "1";

/**
 * Reserva la ingesta durante `ttlMs` para que dos servidores no lean a la vez.
 * Devuelve false si otro ya la tiene.
 */
export const acquireLock = async (name: string, now: number, ttlMs: number): Promise<boolean> => {
  const db = await getDb();
  const result = await db.execute({
    sql: `INSERT INTO meta (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value WHERE CAST(meta.value AS INTEGER) < ?`,
    args: [`lock:${name}`, String(now + ttlMs), now],
  });
  return result.rowsAffected > 0;
};

export const releaseLock = async (name: string): Promise<void> => {
  await (await getDb()).execute({ sql: "DELETE FROM meta WHERE key = ?", args: [`lock:${name}`] });
};

/* ---------- Escritura ---------- */

export type IngestWrite = { stories: Story[]; trends: TrendingSearch[]; at: number; demo: boolean };

const CLEAR_ALL: InStatement[] = ["DELETE FROM stories", "DELETE FROM snapshots", "DELETE FROM trends", "DELETE FROM meta WHERE key NOT LIKE 'lock:%'"];

export const clearAll = async (): Promise<void> => {
  await (await getDb()).batch(CLEAR_ALL, "write");
};

/** Un punto de historial por historia y hora: basta para la tira de 24 h y ahorra escrituras. */
const hourBucket = (at: number): number => Math.floor(at / HOUR_MS) * HOUR_MS;

export const saveIngest = async ({ stories, trends, at, demo }: IngestWrite): Promise<void> => {
  const db = await getDb();
  const wasDemo = !demo && (await isDemo());
  const statements: InStatement[] = [...(wasDemo ? CLEAR_ALL : [])];

  for (const story of stories) {
    const { outlet, firstPublisher, coverage, breakdown, matchedTrend, themes } = story;
    statements.push({
      sql: `INSERT INTO stories (id, country, topic, title, url, payload, first_seen_at, score, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET topic = excluded.topic, title = excluded.title, url = excluded.url,
              payload = excluded.payload, first_seen_at = MIN(stories.first_seen_at, excluded.first_seen_at),
              score = excluded.score, updated_at = excluded.updated_at`,
      args: [
        story.id,
        story.country,
        story.topic,
        story.title,
        story.url,
        JSON.stringify({ outlet, firstPublisher, coverage, breakdown, matchedTrend, themes }),
        story.firstSeenAt,
        story.score,
        at,
      ],
    });
    statements.push({
      sql: `INSERT INTO snapshots (story_id, at, score, coverage) VALUES (?, ?, ?, ?)
            ON CONFLICT(story_id, at) DO UPDATE SET score = MAX(snapshots.score, excluded.score), coverage = excluded.coverage`,
      args: [story.id, hourBucket(at), story.score, coverage.length],
    });
  }
  if (trends.length > 0) {
    statements.push("DELETE FROM trends");
    for (const trend of trends) {
      statements.push({ sql: "INSERT INTO trends (country, query, traffic, at) VALUES (?, ?, ?, ?)", args: [trend.country, trend.query, trend.traffic, at] });
    }
  }
  statements.push(setMetaStatement("last_ingest", String(at)), setMetaStatement("demo", demo ? "1" : "0"));
  await db.batch(statements, "write");
};

/** Borra lo que tenga más de dos días para que la base no crezca sin fin. */
export const prune = async (now: number): Promise<void> => {
  const cutoff = now - 48 * HOUR_MS;
  await (await getDb()).batch(
    [
      { sql: "DELETE FROM snapshots WHERE at < ?", args: [cutoff] },
      { sql: "DELETE FROM stories WHERE updated_at < ?", args: [cutoff] },
      { sql: "DELETE FROM digests WHERE sent_at < ?", args: [now - 30 * 24 * HOUR_MS] },
    ],
    "write",
  );
};

/* ---------- Lectura ---------- */

export const knownStories = async (since: number): Promise<KnownStory[]> =>
  z
    .array(z.object({ id: z.string(), country: z.string(), title: z.string() }))
    .parse(await rowsOf("SELECT id, country, title FROM stories WHERE updated_at >= ?", [since]))
    .flatMap((row) => (isCountry(row.country) ? [{ id: row.id, country: row.country, title: row.title }] : []));

export type StoryQuery = { country?: Country; topic?: Topic };

/** Historias vigentes: las que aparecieron en la última ingesta. */
export const listCurrentStories = async ({ country, topic }: StoryQuery): Promise<Story[]> => {
  const lastIngest = Number((await getMeta("last_ingest")) ?? 0);
  const filters: Array<[string, string]> = [];
  if (country) filters.push(["country = ?", country]);
  if (topic) filters.push(["topic = ?", topic]);
  const where = ["updated_at = ?", ...filters.map(([clause]) => clause)].join(" AND ");
  const rows = await rowsOf(`SELECT * FROM stories WHERE ${where} ORDER BY score DESC`, [lastIngest, ...filters.map(([, value]) => value)]);
  return rows.flatMap((row) => {
    const story = toStory(row);
    return story ? [story] : [];
  });
};

export const historyFor = async (ids: readonly string[], since: number): Promise<Map<string, HeatPoint[]>> => {
  const result = new Map<string, HeatPoint[]>();
  if (ids.length === 0) return result;
  const placeholders = ids.map(() => "?").join(",");
  const rows = z
    .array(z.object({ story_id: z.string(), at: num, score: num }))
    .parse(await rowsOf(`SELECT story_id, at, score FROM snapshots WHERE at >= ? AND story_id IN (${placeholders}) ORDER BY at`, [since, ...ids]));
  for (const row of rows) {
    const list = result.get(row.story_id) ?? [];
    list.push({ at: row.at, score: row.score });
    result.set(row.story_id, list);
  }
  return result;
};

export const latestTrends = async (): Promise<TrendingSearch[]> =>
  z
    .array(z.object({ country: z.string(), query: z.string(), traffic: num }))
    .parse(await rowsOf("SELECT country, query, traffic FROM trends ORDER BY traffic DESC"))
    .flatMap((row) => (isCountry(row.country) ? [{ ...row, country: row.country }] : []));

/* ---------- Correos ---------- */

export const recordDigest = async (record: Omit<DigestRecord, "id"> & { file: string | null; html: string }): Promise<void> => {
  await (await getDb()).execute({
    sql: "INSERT INTO digests (sent_at, recipients, mode, story_count, file, html) VALUES (?, ?, ?, ?, ?, ?)",
    args: [record.sentAt, record.recipients, record.mode, record.storyCount, record.file, record.html],
  });
};

export const listDigests = async (limit: number): Promise<DigestRecord[]> =>
  z
    .array(
      z.object({
        id: num,
        sent_at: num,
        recipients: z.string(),
        mode: z.enum(["smtp", "simulado"]),
        story_count: num,
      }),
    )
    .parse(await rowsOf("SELECT id, sent_at, recipients, mode, story_count FROM digests ORDER BY sent_at DESC LIMIT ?", [limit]))
    .map((row) => ({ id: row.id, sentAt: row.sent_at, recipients: row.recipients, mode: row.mode, storyCount: row.story_count }));

export const lastDigestAt = async (): Promise<number | null> => {
  const [row] = await rowsOf("SELECT MAX(sent_at) AS at FROM digests");
  const parsed = z.object({ at: num.nullable() }).safeParse(row);
  return parsed.success ? parsed.data.at : null;
};
