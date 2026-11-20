import { formatDateTime } from "@/lib/format";
import type { DigestRecord } from "@/lib/types";

export const DigestLog = ({ digests, hours }: { digests: DigestRecord[]; hours: string }) => (
  <section aria-labelledby="digest-title" className="rounded-panel bg-surface p-5">
    <h2 id="digest-title" className="text-lg font-semibold">
      Correos
    </h2>
    <p className="mt-1 text-sm text-muted">Sale solo a las {hours} h (hora de Madrid) con las más virales de cada país.</p>
    {digests.length === 0 ? (
      <p className="mt-3 text-sm text-faint">Todavía no se ha enviado ninguno.</p>
    ) : (
      <ul className="mt-3 divide-y divide-rule text-sm">
        {digests.map((d) => (
          <li key={d.id} className="flex justify-between gap-3 py-2">
            <span>{formatDateTime(d.sentAt)}</span>
            <span className="truncate text-muted">
              {d.storyCount} historias, {d.mode === "smtp" ? `a ${d.recipients}` : "simulado"}
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
);
