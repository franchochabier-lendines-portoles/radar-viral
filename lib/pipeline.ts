import { WINDOW_HOURS } from "@/lib/config";
import { llmGuard } from "@/lib/classify/llm-guard";
import { processItems } from "@/lib/classify/process";
import { knownStories, prune, saveIngest } from "@/lib/db/repository";
import { fetchAll } from "@/lib/sources/fetch";

export type IngestResult = { stories: number; items: number; trends: number; failures: string[]; tookMs: number };

const globalForIngest = globalThis as typeof globalThis & { radarIngestRunning?: Promise<IngestResult> };

const runIngest = async (): Promise<IngestResult> => {
  const started = Date.now();
  const { items, trends, failures } = await fetchAll();
  if (items.length === 0) throw new Error(`No se pudo leer ninguna fuente. ${failures.slice(0, 3).join(" | ")}`);

  const now = Date.now();
  const known = knownStories(now - WINDOW_HOURS * 3_600_000);
  const stories = await llmGuard(processItems(items, trends, known, now));
  saveIngest({ stories, trends, at: now, demo: false });
  prune(now);

  return { stories: stories.length, items: items.length, trends: trends.length, failures, tookMs: Date.now() - started };
};

/** Una ingesta completa. Si ya hay una en marcha, devuelve esa en vez de lanzar otra. */
export const ingest = (): Promise<IngestResult> => {
  globalForIngest.radarIngestRunning ??= runIngest().finally(() => {
    globalForIngest.radarIngestRunning = undefined;
  });
  return globalForIngest.radarIngestRunning;
};
