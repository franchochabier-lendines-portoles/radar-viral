import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ThemeCount } from "@/lib/dashboard";
import { hrefWith, type Filters } from "@/lib/filters";

type ProfileBarProps = { filters: Filters; themes: ThemeCount[]; profileCount: number; allCount: number };

const scopeClasses = (active: boolean): string =>
  cn(
    "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
    active ? "bg-ink text-white" : "text-muted hover:text-ink",
  );

export const ProfileBar = ({ filters, themes, profileCount, allCount }: ProfileBarProps) => {
  const inProfile = filters.scope === "perfil";
  return (
    <section aria-labelledby="profile-title" className="mb-4 rounded-panel bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-prose">
          <h2 id="profile-title" className="text-lg font-semibold">
            {inProfile ? "Solo temas de la línea editorial" : "Todo lo viral, sin filtro de línea"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Temas de servicio y curiosidades (casa, consumo, cocina, salud práctica, mascotas, tiempo, motor…), en noticias de
            cualquier medio.
          </p>
        </div>
        <nav aria-label="Qué noticias ver" className="flex rounded-full border border-rule p-0.5">
          <Link href={hrefWith(filters, { scope: "perfil" })} className={scopeClasses(inProfile)} aria-current={inProfile ? "page" : undefined}>
            Línea editorial <span className="opacity-70">{profileCount}</span>
          </Link>
          <Link href={hrefWith(filters, { scope: "todo" })} className={scopeClasses(!inProfile)} aria-current={!inProfile ? "page" : undefined}>
            Todo lo viral <span className="opacity-70">{allCount}</span>
          </Link>
        </nav>
      </div>

      {inProfile && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Filtrar por tema de la línea">
          {themes.map((theme) => {
            const active = filters.theme === theme.id;
            return (
              <li key={theme.id}>
                <Link
                  href={hrefWith(filters, { theme: theme.id })}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-baseline gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                    active ? "border-ink bg-ink text-white" : "border-rule hover:border-muted",
                    theme.count === 0 && !active && "text-faint",
                  )}
                >
                  {theme.label}
                  <span className={active ? "text-white/70" : "text-faint"}>{theme.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
