import Link from "next/link";
import { COUNTRY_INFO, TOPIC_LABEL } from "@/lib/config";
import { cn } from "@/lib/cn";
import { hourlyHeat } from "@/lib/dashboard";
import { hrefWith, type Filters } from "@/lib/filters";
import { formatTime } from "@/lib/format";
import { THEME_BY_ID } from "@/lib/profile";
import type { StoryWithHistory } from "@/lib/types";
import { HeatStrip } from "./heat-strip";
import { heatClasses } from "./heat-style";

type StoryListProps = { stories: StoryWithHistory[]; total: number; filters: Filters; now: number };

const RISING = 5;

export const kindOf = (story: StoryWithHistory): string => {
  const [theme] = story.themes;
  return theme ? THEME_BY_ID[theme].label.toLowerCase() : TOPIC_LABEL[story.topic].toLowerCase();
};

const describeFilters = ({ country, topic, theme }: Filters, total: number): string => {
  const where = country ? ` en ${COUNTRY_INFO[country].name}` : " en los cuatro países";
  const what = theme ? ` de ${THEME_BY_ID[theme].label.toLowerCase()}` : topic ? ` de ${TOPIC_LABEL[topic].toLowerCase()}` : "";
  return `${total} ${total === 1 ? "historia" : "historias"}${what}${where}`;
};

const breakdownTitle = (story: StoryWithHistory): string => {
  const pct = (value: number): number => Math.round(value * 100);
  const b = story.breakdown;
  return `Cobertura ${pct(b.coverage)}%, tendencia ${pct(b.trend)}%, frescura ${pct(b.freshness)}%, posición ${pct(b.position)}%`;
};

const Delta = ({ delta }: { delta: number }) => {
  if (delta >= RISING) return <span className="font-medium text-rise">+{delta} en la última hora</span>;
  if (delta <= -RISING) return <span className="text-faint">−{Math.abs(delta)} en la última hora</span>;
  return <span className="text-faint">Sin cambios en 1 h</span>;
};

const StoryRow = ({ story, now }: { story: StoryWithHistory; now: number }) => {
  const others = story.coverage.length - 1;
  const firstIsLead = story.firstPublisher.outletId === story.outlet.outletId;
  return (
    <li className="grid grid-cols-[3rem_1fr] gap-x-4 gap-y-2 border-b border-rule py-4 last:border-b-0 md:grid-cols-[3rem_1fr_auto]">
      <span
        title={breakdownTitle(story)}
        className={cn("flex h-12 items-center justify-center rounded-cell text-xl font-semibold", heatClasses(story.score))}
      >
        {story.score}
      </span>

      <div className="min-w-0">
        <p className="text-xs text-muted">
          {COUNTRY_INFO[story.country].name}, {kindOf(story)}
        </p>
        <h3 className="mt-0.5 font-serif text-lg leading-snug font-medium text-pretty">
          <a href={story.url} target="_blank" rel="noreferrer" className="hover:underline decoration-1 underline-offset-4">
            {story.title}
          </a>
        </h3>
        <div className="mt-1 text-sm text-muted">
          {story.outlet.name}
          {firstIsLead ? ", que la publicó primero" : `. Primero ${story.firstPublisher.name} a las ${formatTime(story.firstPublisher.publishedAt)}`}
          {others > 0 && (
            <>
              {" "}
              y{" "}
              <details className="inline [&[open]>summary]:text-ink">
                <summary className="inline cursor-pointer list-none underline decoration-rule decoration-1 underline-offset-4 hover:decoration-muted">
                  {others} {others === 1 ? "medio más" : "medios más"}
                </summary>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {story.coverage
                    .filter((c) => c.outletId !== story.outlet.outletId)
                    .map((c) => (
                      <a key={c.outletId} href={c.url} target="_blank" rel="noreferrer" className="text-ink hover:underline">
                        {c.name} <span className="text-faint">{formatTime(c.publishedAt)}</span>
                      </a>
                    ))}
                </span>
              </details>
            </>
          )}
        </div>
      </div>

      <div className="col-start-2 flex items-center gap-4 text-xs md:col-start-3 md:flex-col md:items-end md:justify-center md:gap-1.5">
        <HeatStrip hours={hourlyHeat(story.history, now)} now={now} />
        <Delta delta={story.delta} />
      </div>
    </li>
  );
};

export const StoryList = ({ stories, total, filters, now }: StoryListProps) => {
  const filtered = filters.country !== null || filters.topic !== null || filters.theme !== null;
  return (
    <section aria-labelledby="list-title" className="rounded-panel bg-surface px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="list-title" className="text-xl font-semibold">
          {describeFilters(filters, total)}
        </h2>
        {filtered && (
          <Link href={filters.scope === "todo" ? "/?ver=todo" : "/"} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
            Ver todo
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">La primera está destacada arriba. La tira de la derecha es el calor de cada historia hora a hora en las últimas 24 h.</p>

      {stories.length === 0 ? (
        <p className="py-10 text-center text-muted">No hay historias con estos filtros ahora mismo.</p>
      ) : (
        <ol className="mt-2">
          {stories.map((story) => (
            <StoryRow key={story.id} story={story} now={now} />
          ))}
        </ol>
      )}
    </section>
  );
};
