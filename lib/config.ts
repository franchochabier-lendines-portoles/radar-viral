export const COUNTRIES = ["ES", "GB", "FR", "US"] as const;
export type Country = (typeof COUNTRIES)[number];

export const TOPICS = [
  "internacional",
  "curiosidades",
  "jardineria",
  "eventos",
  "economia",
  "novedades",
] as const;
export type Topic = (typeof TOPICS)[number];

export type CountryInfo = {
  name: string;
  short: string;
  hl: string;
  gl: string;
  ceid: string;
  lang: "es" | "en" | "fr";
};

export const COUNTRY_INFO: Record<Country, CountryInfo> = {
  ES: { name: "España", short: "ES", hl: "es", gl: "ES", ceid: "ES:es", lang: "es" },
  GB: { name: "Inglaterra", short: "UK", hl: "en-GB", gl: "GB", ceid: "GB:en", lang: "en" },
  FR: { name: "Francia", short: "FR", hl: "fr", gl: "FR", ceid: "FR:fr", lang: "fr" },
  US: { name: "Estados Unidos", short: "US", hl: "en-US", gl: "US", ceid: "US:en", lang: "en" },
};

export const TOPIC_LABEL: Record<Topic, string> = {
  internacional: "Internacional",
  curiosidades: "Curiosidades",
  jardineria: "Jardinería",
  eventos: "Eventos",
  economia: "Economía",
  novedades: "Novedades",
};

export type Outlet = { id: string; name: string; domains: string[] };

/** Medios españoles con desglose propio. Para añadir uno basta con una línea. */
export const ES_OUTLETS: Outlet[] = [
  { id: "elespanol", name: "El Español", domains: ["elespanol.com"] },
  { id: "elmundo", name: "El Mundo", domains: ["elmundo.es"] },
  { id: "elpais", name: "El País", domains: ["elpais.com"] },
  { id: "okdiario", name: "OKDIARIO", domains: ["okdiario.com"] },
  { id: "abc", name: "ABC", domains: ["abc.es"] },
  { id: "larazon", name: "La Razón", domains: ["larazon.es"] },
  { id: "elconfidencial", name: "El Confidencial", domains: ["elconfidencial.com"] },
  { id: "20minutos", name: "20 Minutos", domains: ["20minutos.es"] },
  { id: "elperiodico", name: "El Periódico", domains: ["elperiodico.com"] },
  { id: "lavanguardia", name: "La Vanguardia", domains: ["lavanguardia.com"] },
];
export const OTHER_OUTLET_ID = "otros";

/** Pesos del índice viral (suman 1). */
export const SCORE_WEIGHTS = {
  coverage: 0.35,
  trend: 0.25,
  freshness: 0.25,
  position: 0.15,
} as const;

/** Medios que hacen falta para cobertura máxima. */
export const COVERAGE_SATURATION = 8;
/** Vida media de la frescura, en horas. */
export const FRESHNESS_HALF_LIFE_HOURS = 4;
/** Máximo de historias que se guardan por país y topic en cada lectura (las más virales). */
export const MAX_STORIES_PER_CELL = 40;

/** Ventana de noticias consideradas, en horas. */
export const WINDOW_HOURS = 24;

export const isCountry = (value: unknown): value is Country =>
  typeof value === "string" && (COUNTRIES as readonly string[]).includes(value);

export const isTopic = (value: unknown): value is Topic =>
  typeof value === "string" && (TOPICS as readonly string[]).includes(value);
