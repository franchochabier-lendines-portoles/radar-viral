import { heatStep, isDarkStep } from "@/lib/heat";

const BACKGROUND = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4", "bg-heat-5"] as const;

/** Fondo de la rampa y tinta legible encima. */
export const heatClasses = (score: number): string => {
  const step = heatStep(score);
  return `${BACKGROUND[step]} ${isDarkStep(step) ? "text-white" : "text-ink"}`;
};

export const HEAT_LEGEND = BACKGROUND.map((background, step) => ({ background, from: [0, 15, 30, 45, 60, 75][step] ?? 0 }));
