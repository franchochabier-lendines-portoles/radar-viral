import { isCountry, isTopic, type Country, type Topic } from "@/lib/config";
import { isThemeId, type ThemeId } from "@/lib/profile";

/** "perfil" = solo temas de la línea editorial; "todo" = todo lo viral. */
export type Scope = "perfil" | "todo";

export type Filters = { country: Country | null; topic: Topic | null; theme: ThemeId | null; scope: Scope };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

export const parseFilters = (params: SearchParams): Filters => {
  const country = first(params.pais)?.toUpperCase();
  const topic = first(params.tema);
  const theme = first(params.linea);
  return {
    country: isCountry(country) ? country : null,
    topic: isTopic(topic) ? topic : null,
    theme: isThemeId(theme) ? theme : null,
    scope: first(params.ver) === "todo" ? "todo" : "perfil",
  };
};

const toggled = <T>(current: T | null, wanted: T | null | undefined): T | null =>
  wanted === undefined ? current : wanted === current ? null : wanted;

/** Enlace con los filtros cambiados. Volver a pulsar un filtro activo lo quita. */
export const hrefWith = (current: Filters, change: Partial<Filters>): string => {
  const cell = change.country !== undefined && change.topic !== undefined;
  const sameCell = cell && change.country === current.country && change.topic === current.topic;
  const next: Filters = {
    country: sameCell ? null : cell ? (change.country ?? null) : toggled(current.country, change.country),
    topic: sameCell ? null : cell ? (change.topic ?? null) : toggled(current.topic, change.topic),
    theme: toggled(current.theme, change.theme),
    scope: change.scope ?? current.scope,
  };
  if (next.scope === "todo") next.theme = null;
  const params = new URLSearchParams();
  if (next.scope === "todo") params.set("ver", "todo");
  if (next.country) params.set("pais", next.country.toLowerCase());
  if (next.topic) params.set("tema", next.topic);
  if (next.theme) params.set("linea", next.theme);
  const query = params.toString();
  return query ? `/?${query}` : "/";
};
