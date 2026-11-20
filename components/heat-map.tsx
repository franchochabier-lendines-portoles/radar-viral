import type { CSSProperties } from "react";
import Link from "next/link";
import { COUNTRIES, COUNTRY_INFO, TOPICS, TOPIC_LABEL } from "@/lib/config";
import { cn } from "@/lib/cn";
import type { HeatCell } from "@/lib/dashboard";
import { hrefWith, type Filters } from "@/lib/filters";
import { HEAT_LEGEND, heatClasses } from "./heat-style";

type HeatMapProps = { cells: HeatCell[]; filters: Filters };

const cellLabel = (cell: HeatCell): string =>
  cell.count === 0
    ? `${COUNTRY_INFO[cell.country].name}, ${TOPIC_LABEL[cell.topic]}: sin historias ahora`
    : `${COUNTRY_INFO[cell.country].name}, ${TOPIC_LABEL[cell.topic]}: índice ${cell.top}, ${cell.count} historias. Más caliente: ${cell.leader ?? ""}`;

const orderStyle = (order: number): CSSProperties & Record<"--order", number> => ({ "--order": order });

const isActive = (cell: HeatCell, filters: Filters): boolean =>
  (filters.country === null || filters.country === cell.country) && (filters.topic === null || filters.topic === cell.topic);

const Cell = ({ cell, filters, order }: { cell: HeatCell; filters: Filters; order: number }) => {
  const dimmed = (filters.country !== null || filters.topic !== null) && !isActive(cell, filters);
  return (
    <td className="p-0.5">
      <Link
        href={hrefWith(filters, { country: cell.country, topic: cell.topic })}
        aria-label={cellLabel(cell)}
        className={cn(
          "group relative flex h-16 flex-col justify-between rounded-cell px-2.5 py-2 transition-opacity duration-150 sm:h-20",
          cell.count === 0 ? "bg-cold text-faint" : heatClasses(cell.top),
          dimmed && "opacity-30 hover:opacity-100",
          "warm-up",
        )}
        style={orderStyle(order)}
      >
        <span className="text-2xl font-semibold leading-none tracking-tight sm:text-3xl">{cell.count === 0 ? "" : cell.top}</span>
        <span className="text-xs opacity-80">{cell.count === 0 ? "nada" : `${cell.count} hist.`}</span>
        {cell.leader && (
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-cell bg-ink px-3 py-2 font-serif text-sm leading-snug text-white shadow-lg group-hover:block group-focus-visible:block"
          >
            {cell.leader}
          </span>
        )}
      </Link>
    </td>
  );
};

export const HeatMap = ({ cells, filters }: HeatMapProps) => (
  <section aria-labelledby="heat-title" className="rounded-panel bg-surface p-4 sm:p-6">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="heat-title" className="text-xl font-semibold">
          Dónde quema ahora
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted">
          Cada celda muestra la historia más viral del país y el tema. Pulsa una celda, un país o un tema para filtrar.
        </p>
      </div>
      <figure className="flex items-center gap-2 text-xs text-muted" aria-label="Escala del índice viral de 0 a 100">
        <span>Frío</span>
        <span className="flex overflow-hidden rounded-cell">
          {HEAT_LEGEND.map((step) => (
            <span key={step.from} className={cn("h-3 w-6", step.background)} title={`Desde ${step.from}`} />
          ))}
        </span>
        <span>Quema</span>
      </figure>
    </div>

    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-2xl table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="w-24" />
            {TOPICS.map((topic) => (
              <th key={topic} scope="col" className="truncate px-1 pb-2 text-left text-sm font-medium">
                <Link
                  href={hrefWith(filters, { topic })}
                  className={cn("rounded-sm hover:underline", filters.topic === topic ? "text-ink underline underline-offset-4" : "text-muted")}
                >
                  {TOPIC_LABEL[topic]}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COUNTRIES.map((country, row) => (
            <tr key={country}>
              <th scope="row" className="pr-2 text-left text-sm font-medium">
                <Link
                  href={hrefWith(filters, { country })}
                  className={cn("rounded-sm hover:underline", filters.country === country ? "text-ink underline underline-offset-4" : "text-muted")}
                >
                  {COUNTRY_INFO[country].name}
                </Link>
              </th>
              {TOPICS.map((topic, column) => {
                const cell = cells.find((c) => c.country === country && c.topic === topic);
                return cell ? <Cell key={topic} cell={cell} filters={filters} order={row + column} /> : <td key={topic} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
