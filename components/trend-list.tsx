import { COUNTRIES, COUNTRY_INFO, type Country } from "@/lib/config";
import { formatTraffic } from "@/lib/format";
import type { TrendingSearch } from "@/lib/types";

type TrendListProps = { trends: Record<Country, TrendingSearch[]>; country: Country | null };

const PER_COUNTRY_WHEN_ALL = 4;

export const TrendList = ({ trends, country }: TrendListProps) => {
  const countries = country ? [country] : [...COUNTRIES];
  return (
    <section aria-labelledby="trends-title" className="rounded-panel bg-surface p-5">
      <h2 id="trends-title" className="text-lg font-semibold">
        Lo que se busca
      </h2>
      <p className="mt-1 text-sm text-muted">Búsquedas en tendencia en Google, ya sin política ni deportes.</p>
      <div className="mt-3 space-y-4">
        {countries.map((c) => {
          const list = country ? trends[c] : trends[c].slice(0, PER_COUNTRY_WHEN_ALL);
          return (
            <div key={c}>
              <h3 className="text-sm font-medium">{COUNTRY_INFO[c].name}</h3>
              {list.length === 0 ? (
                <p className="mt-1 text-sm text-faint">Sin datos de tendencias.</p>
              ) : (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {list.map((t) => (
                    <li key={t.query} className="rounded-full border border-rule px-2.5 py-0.5 text-sm">
                      {t.query}
                      {t.traffic > 0 && <span className="ml-1.5 text-faint">{formatTraffic(t.traffic)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
