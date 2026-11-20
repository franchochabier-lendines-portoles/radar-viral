import { COVERAGE_SATURATION, FRESHNESS_HALF_LIFE_HOURS, SCORE_WEIGHTS } from "@/lib/config";
import type { ScoreBreakdown, TrendingSearch } from "@/lib/types";
import { tokenize } from "./text";

const HOUR_MS = 3_600_000;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const coverageScore = (outletCount: number): number => clamp01((outletCount - 1) / (COVERAGE_SATURATION - 1));

export const freshnessScore = (publishedAt: number, now: number): number => {
  const ageHours = Math.max(0, now - publishedAt) / HOUR_MS;
  return clamp01(0.5 ** (ageHours / FRESHNESS_HALF_LIFE_HOURS));
};

/** 1 si es la primera del feed, 0 si es la última. */
export const positionScore = (position: number, size: number): number =>
  size <= 1 ? 1 : clamp01(1 - position / (size - 1));

export type TrendMatch = { score: number; query: string | null };

/**
 * Coincidencia con lo que la gente busca: proporción de palabras de la búsqueda que
 * aparecen en el titular, ponderada por el volumen relativo de esa búsqueda.
 */
export const trendScore = (title: string, trends: readonly TrendingSearch[]): TrendMatch => {
  const titleTokens = new Set(tokenize(title));
  const maxTraffic = Math.max(1, ...trends.map((trend) => trend.traffic));
  return trends.reduce<TrendMatch>(
    (best, trend) => {
      const queryTokens = tokenize(trend.query);
      if (queryTokens.length === 0) return best;
      const hits = queryTokens.filter((token) => titleTokens.has(token)).length;
      const overlap = hits / queryTokens.length;
      // Búsquedas cortas ("winter wonderland") tienen que aparecer enteras.
      const needed = queryTokens.length <= 2 ? 1 : 0.6;
      if (overlap < needed) return best;
      const volume = 0.6 + 0.4 * Math.sqrt(trend.traffic / maxTraffic);
      const score = clamp01(overlap * volume);
      return score > best.score ? { score, query: trend.query } : best;
    },
    { score: 0, query: null },
  );
};

export const viralScore = (breakdown: ScoreBreakdown): number =>
  Math.round(
    100 *
      (SCORE_WEIGHTS.coverage * breakdown.coverage +
        SCORE_WEIGHTS.trend * breakdown.trend +
        SCORE_WEIGHTS.freshness * breakdown.freshness +
        SCORE_WEIGHTS.position * breakdown.position),
  );
