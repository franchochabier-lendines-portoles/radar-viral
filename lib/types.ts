import type { Country, Topic } from "@/lib/config";
import type { ThemeId } from "@/lib/profile";

/** Un titular tal como llega de una fuente, sin clasificar. */
export type RawItem = {
  country: Country;
  /** Topic que sugiere el feed; null si el feed es genérico (p. ej. un medio). */
  topicHint: Topic | null;
  title: string;
  url: string;
  sourceName: string;
  sourceDomain: string | null;
  publishedAt: number;
  /** Posición dentro de su feed (0 = primera). */
  feedPosition: number;
  feedSize: number;
};

export type TrendingSearch = {
  country: Country;
  query: string;
  traffic: number;
};

export type Coverage = {
  outletId: string;
  name: string;
  domain: string | null;
  url: string;
  publishedAt: number;
};

export type ScoreBreakdown = {
  coverage: number;
  trend: number;
  freshness: number;
  position: number;
};

/** Una historia: varios titulares agrupados que cuentan lo mismo. */
export type Story = {
  id: string;
  country: Country;
  topic: Topic;
  title: string;
  url: string;
  /** Medio del titular principal. */
  outlet: Coverage;
  /** El que la publicó primero. */
  firstPublisher: Coverage;
  coverage: Coverage[];
  firstSeenAt: number;
  score: number;
  breakdown: ScoreBreakdown;
  matchedTrend: string | null;
  /** Temas del perfil editorial en los que encaja (vacío = no encaja). */
  themes: ThemeId[];
};

export type HeatPoint = { at: number; score: number };

export type StoryWithHistory = Story & {
  history: HeatPoint[];
  /** Diferencia de puntuación frente a hace una hora. */
  delta: number;
};

export type DigestRecord = {
  id: number;
  sentAt: number;
  recipients: string;
  mode: "smtp" | "simulado";
  storyCount: number;
};
