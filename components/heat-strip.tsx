import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/format";
import { heatStep } from "@/lib/heat";

const STRIP = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4", "bg-heat-5"] as const;
const HOUR_MS = 3_600_000;

type HeatStripProps = { hours: Array<number | null>; now: number };

/** 24 casillas, una por hora: el color es el índice máximo de esa hora. */
export const HeatStrip = ({ hours, now }: HeatStripProps) => {
  const present = hours.filter((h): h is number => h !== null);
  const summary =
    present.length === 0
      ? "Sin historial"
      : `En el radar ${present.length} de las últimas 24 horas, máximo ${Math.max(...present)}`;
  return (
    <div className="flex items-end gap-px" role="img" aria-label={summary}>
      {hours.map((score, index) => {
        const hourStart = now - (hours.length - index) * HOUR_MS;
        return (
          <span
            key={hourStart}
            title={score === null ? `${formatTime(hourStart)}: fuera del radar` : `${formatTime(hourStart)}: ${score}`}
            className={cn("h-5 w-1.5 first:rounded-l-sm last:rounded-r-sm", score === null ? "bg-cold" : STRIP[heatStep(score)])}
          />
        );
      })}
    </div>
  );
};
