import { AutoRefresh, Toolbar } from "@/components/actions";
import { DigestLog } from "@/components/digest-log";
import { HeatMap } from "@/components/heat-map";
import { LeadStory } from "@/components/lead-story";
import { OutletBoard } from "@/components/outlet-board";
import { ProfileBar } from "@/components/profile-bar";
import { StoryList } from "@/components/story-list";
import { TrendList } from "@/components/trend-list";
import { TOPIC_LABEL } from "@/lib/config";
import { isReadOnly } from "@/lib/access";
import { getDashboard } from "@/lib/dashboard";
import { parseFilters } from "@/lib/filters";
import { formatTime, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const DIGEST_HOURS = (process.env.DIGEST_HOURS ?? "9,14,20").split(",").join(", ");

const Page = async ({ searchParams }: PageProps) => {
  const filters = parseFilters(await searchParams);
  const now = Date.now();
  const data = getDashboard(filters, now);
  const [lead, ...rest] = data.stories;

  return (
    <main className="mx-auto max-w-[90rem] px-3 py-5 sm:px-6 lg:py-8">
      <AutoRefresh />
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Radar viral</h1>
          <p className="mt-1 text-muted">
            Lo que más se está contando ahora en España, Inglaterra, Francia y Estados Unidos.{" "}
            {data.lastIngest ? (
              <span>
                Última lectura a las {formatTime(data.lastIngest)}, {timeAgo(data.lastIngest, now)}.
              </span>
            ) : (
              <span>Aún no hay datos{isReadOnly() ? "; la primera lectura llega en unos minutos" : ": pulsa Actualizar"}.</span>
            )}
          </p>
        </div>
        <Toolbar readOnly={isReadOnly()} />
      </header>

      {data.demo && (
        <p className="mb-4 rounded-panel bg-notice px-4 py-3 text-sm">
          Estás viendo datos de demo: titulares inventados repartidos al azar entre medios reales. Al pulsar uno se abre una búsqueda de ese tema en Google News. {isReadOnly() ? "Se sustituirán por datos reales en la próxima lectura." : "Pulsa Actualizar para leer las fuentes de verdad."}
        </p>
      )}

      <ProfileBar filters={filters} themes={data.themes} profileCount={data.profileCount} allCount={data.allCount} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <HeatMap cells={data.heat} filters={filters} />
        </div>
        <div className="flex lg:col-span-5 [&>section]:flex-1">
          <LeadStory story={lead} />
        </div>

        <div className="lg:col-span-8">
          <StoryList stories={rest} total={data.totalStories} filters={filters} now={now} />
        </div>
        <aside className="space-y-4 lg:col-span-4">
          <OutletBoard rows={data.spainOutlets} topicLabel={filters.topic ? TOPIC_LABEL[filters.topic] : null} />
          <TrendList trends={data.trends} country={filters.country} />
          <DigestLog digests={data.digests} hours={DIGEST_HOURS} />
        </aside>
      </div>

      <footer className="mt-8 max-w-prose text-sm text-muted">
        El índice viral va de 0 a 100 y mezcla cuántos medios cuentan la historia, si coincide con lo que la gente busca, lo
        reciente que es y su posición en portada. No son visitas reales. Nunca se muestran noticias de política ni de deportes.
      </footer>
    </main>
  );
};

export default Page;
