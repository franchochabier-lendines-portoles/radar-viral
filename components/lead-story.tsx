import { COUNTRY_INFO, SCORE_WEIGHTS } from "@/lib/config";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import type { StoryWithHistory } from "@/lib/types";
import { kindOf } from "./story-list";
import { heatClasses } from "./heat-style";

const FACTORS = [
  { key: "coverage", label: "Medios que la cuentan" },
  { key: "trend", label: "Coincide con lo que se busca" },
  { key: "freshness", label: "Frescura" },
  { key: "position", label: "Posición en portada" },
] as const;

const MAX_OUTLETS = 6;

export const LeadStory = ({ story }: { story: StoryWithHistory | undefined }) => {
  if (!story) {
    return (
      <section className="flex flex-col justify-center rounded-panel bg-surface p-6">
        <h2 className="text-xl font-semibold">Nada caliente con estos filtros</h2>
        <p className="mt-2 text-sm text-muted">Quita algún filtro o lanza una lectura nueva con Actualizar.</p>
      </section>
    );
  }

  const shown = story.coverage.slice(0, MAX_OUTLETS);
  const hidden = story.coverage.length - shown.length;

  return (
    <section aria-labelledby="lead-title" className="flex flex-col rounded-panel bg-ink p-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-white/70">
          La más caliente en {COUNTRY_INFO[story.country].name}, {kindOf(story)}
        </p>
        <span className={cn("rounded-cell px-2.5 py-1 text-2xl font-semibold leading-none", heatClasses(story.score))}>
          {story.score}
        </span>
      </div>

      <h2 id="lead-title" className="mt-3 font-serif text-3xl leading-tight font-medium text-balance">
        <a href={story.url} target="_blank" rel="noreferrer" className="hover:underline decoration-1 underline-offset-4">
          {story.title}
        </a>
      </h2>

      <p className="mt-3 text-sm text-white/70">
        Publicada primero por <span className="text-white">{story.firstPublisher.name}</span> a las{" "}
        {formatTime(story.firstPublisher.publishedAt)}
        {story.matchedTrend && (
          <>
            . La gente busca <span className="text-white">“{story.matchedTrend}”</span>
          </>
        )}
      </p>

      <dl className="mt-auto grid pt-6 grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {FACTORS.map(({ key, label }) => {
          const value = story.breakdown[key];
          return (
            <div key={key}>
              <dt className="flex justify-between text-xs text-white/70">
                <span>{label}</span>
                <span>{Math.round(value * SCORE_WEIGHTS[key] * 100)} pts</span>
              </dt>
              <dd className="mt-1 h-1.5 rounded-full bg-white/15">
                <span className="block h-full rounded-full bg-heat-2" style={{ width: `${Math.round(value * 100)}%` }} />
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="pt-5">
        <h3 className="text-xs text-white/70">La cuentan {story.coverage.length} medios</h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {shown.map((outlet) => (
            <li key={outlet.outletId}>
              <a
                href={outlet.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-baseline gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs hover:bg-white/20"
              >
                {outlet.name}
                <span className="text-white/60">{formatTime(outlet.publishedAt)}</span>
              </a>
            </li>
          ))}
          {hidden > 0 && <li className="px-1 py-1 text-xs text-white/60">y {hidden} más</li>}
        </ul>
      </div>
    </section>
  );
};
