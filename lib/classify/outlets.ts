import { ES_OUTLETS, OTHER_OUTLET_ID, type Outlet } from "@/lib/config";
import { normalize } from "./text";

const domainMatches = (domain: string, outlet: Outlet): boolean =>
  outlet.domains.some((known) => domain === known || domain.endsWith(`.${known}`));

/** Reconoce un medio español del catálogo por dominio o, si no hay dominio, por nombre. */
export const findSpanishOutlet = (domain: string | null, name: string): Outlet | null => {
  if (domain) {
    const byDomain = ES_OUTLETS.find((outlet) => domainMatches(domain, outlet));
    if (byDomain) return byDomain;
  }
  const normalizedName = normalize(name);
  return ES_OUTLETS.find((outlet) => normalize(outlet.name) === normalizedName) ?? null;
};

/** Id estable para un medio: el del catálogo o uno derivado del dominio/nombre. */
export const outletIdOf = (domain: string | null, name: string): string => {
  const known = findSpanishOutlet(domain, name);
  if (known) return known.id;
  return domain ?? (normalize(name).replace(/ /g, "-") || OTHER_OUTLET_ID);
};
