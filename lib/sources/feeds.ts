import { COUNTRIES, COUNTRY_INFO, ES_OUTLETS, type Country, type Topic } from "@/lib/config";
import { THEMES } from "@/lib/profile";

export type Feed = {
  country: Country;
  topicHint: Topic | null;
  url: string;
  label: string;
};

const GOOGLE_NEWS = "https://news.google.com/rss";

const editionQuery = (country: Country): string => {
  const info = COUNTRY_INFO[country];
  return `hl=${info.hl}&gl=${info.gl}&ceid=${info.ceid}`;
};

const sectionFeed = (country: Country, section: string, topicHint: Topic): Feed => ({
  country,
  topicHint,
  label: `${country} sección ${section}`,
  url: `${GOOGLE_NEWS}/headlines/section/topic/${section}?${editionQuery(country)}`,
});

const searchFeed = (country: Country, query: string, topicHint: Topic | null, label: string): Feed => ({
  country,
  topicHint,
  label,
  url: `${GOOGLE_NEWS}/search?q=${encodeURIComponent(`${query} when:1d`)}&${editionQuery(country)}`,
});

/**
 * Búsquedas por topic en cada idioma. Las exclusiones (-fútbol, -elecciones…) son una
 * primera barrera; el filtro de lib/classify/exclusion.ts es el que manda.
 */
const SEARCHES: Record<"es" | "en" | "fr", Record<"curiosidades" | "jardineria" | "eventos", string>> = {
  es: {
    curiosidades: "curiosidades OR insólito OR sorprendente OR viral -fútbol -liga -elecciones -gobierno",
    jardineria: "jardinería OR plantas OR huerto OR jardín",
    eventos: "festival OR concierto OR exposición OR feria -fútbol -partido -mitin",
  },
  en: {
    curiosidades: "bizarre OR weird OR viral OR quirky -football -election -senate",
    jardineria: "gardening OR garden OR houseplants OR allotment",
    eventos: "festival OR concert OR exhibition OR fair -football -match -rally",
  },
  fr: {
    curiosidades: "insolite OR étonnant OR viral OR incroyable -football -élection -gouvernement",
    jardineria: "jardinage OR jardin OR plantes OR potager",
    eventos: "festival OR concert OR exposition OR salon -football -match -meeting",
  },
};

/** Secciones que se leen. NATION y SPORTS no se leen nunca. */
const SECTIONS: Array<[string, Topic]> = [
  ["WORLD", "internacional"],
  ["BUSINESS", "economia"],
  ["TECHNOLOGY", "novedades"],
  ["SCIENCE", "novedades"],
];

const countryFeeds = (country: Country): Feed[] => {
  const lang = COUNTRY_INFO[country].lang;
  const searches = SEARCHES[lang];
  return [
    ...SECTIONS.map(([section, topic]) => sectionFeed(country, section, topic)),
    searchFeed(country, searches.curiosidades, "curiosidades", `${country} curiosidades`),
    searchFeed(country, searches.jardineria, "jardineria", `${country} jardinería`),
    searchFeed(country, searches.eventos, "eventos", `${country} eventos`),
    ...THEMES.map((theme) => searchFeed(country, theme.search[lang], theme.topic, `${country} perfil ${theme.label}`)),
  ];
};

/** Lo último de cada medio español: sirve para saber quién cuenta cada historia. */
const spanishOutletFeeds = (): Feed[] =>
  ES_OUTLETS.map((outlet) =>
    searchFeed("ES", `site:${outlet.domains[0] ?? outlet.id}`, null, `ES medio ${outlet.name}`),
  );

export const buildFeeds = (): Feed[] => [...COUNTRIES.flatMap(countryFeeds), ...spanishOutletFeeds()];

export const trendsFeedUrl = (country: Country): string =>
  `https://trends.google.com/trending/rss?geo=${COUNTRY_INFO[country].gl}`;
