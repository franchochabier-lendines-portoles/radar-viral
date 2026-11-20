import { WINDOW_HOURS } from "@/lib/config";
import { llmGuard } from "@/lib/classify/llm-guard";
import { processItems } from "@/lib/classify/process";
import { acquireLock, getMeta, knownStories, prune, releaseLock, saveIngest } from "@/lib/db/repository";
import { fetchAll } from "@/lib/sources/fetch";

export type IngestResult = { stories: number; items: number; trends: number; failures: string[]; tookMs: number };

/** Minutos que tienen que pasar para que abrir el radar lance una lectura nueva. */
export const STALE_AFTER_MINUTES = Number(process.env.STALE_AFTER_MINUTES ?? 10);
const LOCK_TTL_MS = 3 * 60_000;

const globalForIngest = globalThis as typeof globalThis & { radarIngestRunning?: Promise<IngestResult> };

const runIngest = async (): Promise<IngestResult> => {
  const started = Date.now();
  const { items, trends, failures } = await fetchAll();
  if (items.length === 0) throw new Error(`No se pudo leer ninguna fuente. ${failures.slice(0, 3).join(" | ")}`);

  const now = Date.now();
  const known = await knownStories(now - WINDOW_HOURS * 3_600_000);
  const stories = await llmGuard(processItems(items, trends, known, now));
  await saveIngest({ stories, trends, at: now, demo: false });
  await prune(now);

  return { stories: stories.length, items: items.length, trends: trends.length, failures, tookMs: Date.now() - started };
};

/** Una ingesta completa. Si ya hay una en marcha en este proceso, devuelve esa. */
export const ingest = (): Promise<IngestResult> => {
  globalForIngest.radarIngestRunning ??= runIngest().finally(() => {
    globalForIngest.radarIngestRunning = undefined;
  });
  return globalForIngest.radarIngestRunning;
};

/**
 * Lanza una ingesta solo si los datos tienen más de STALE_AFTER_MINUTES y ningún otro
 * servidor está ya leyendo. Pensado para llamarse al abrir el radar.
 */
export const ingestIfStale = async (now = Date.now()): Promise<IngestResult | null> => {
  const last = Number((await getMeta("last_ingest")) ?? 0);
  const demo = (await getMeta("demo")) === "1";
  if (!demo && now - last < STALE_AFTER_MINUTES * 60_000) return null;
  if (!(await acquireLock("ingest", now, LOCK_TTL_MS))) return null;
  try {
    return await ingest();
  } finally {
    await releaseLock("ingest");
  }
};
