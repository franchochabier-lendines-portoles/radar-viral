import type { OutletRow } from "@/lib/dashboard";

type OutletBoardProps = { rows: OutletRow[]; topicLabel: string | null };

/** Desglose por medio de España: cuántas historias calientes cuenta cada uno. */
export const OutletBoard = ({ rows, topicLabel }: OutletBoardProps) => {
  const max = Math.max(1, ...rows.map((r) => r.stories));
  return (
    <section aria-labelledby="outlets-title" className="rounded-panel bg-surface p-5">
      <h2 id="outlets-title" className="text-lg font-semibold">
        Medios de España
      </h2>
      <p className="mt-1 text-sm text-muted">
        Historias calientes{topicLabel ? ` de ${topicLabel.toLowerCase()}` : ""} que cuenta cada medio y cuántas dio primero.
      </p>
      <table className="mt-4 w-full text-sm">
        <thead className="text-xs text-faint">
          <tr>
            <th className="pb-1 text-left font-normal">Medio</th>
            <th className="pb-1 text-left font-normal">Historias</th>
            <th className="pb-1 text-right font-normal">La dio primero</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} title={row.stories > 0 ? `Índice medio de sus historias: ${row.avgScore}` : undefined}>
              <th scope="row" className="w-32 py-1.5 pr-3 text-left font-normal whitespace-nowrap">
                {row.name}
              </th>
              <td className="py-1.5">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 rounded-sm bg-heat-4" style={{ width: `${(row.stories / max) * 100}%`, minWidth: row.stories > 0 ? "4px" : 0 }} />
                  <span className="text-muted">{row.stories}</span>
                </span>
              </td>
              <td className="w-24 py-1.5 text-right text-muted">{row.firsts > 0 ? row.firsts : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
