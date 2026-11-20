/**
 * Rampa secuencial de un solo tono (magenta), de frío a caliente. La usan el dashboard
 * (vía las variables CSS --color-heat-N) y el correo (valores en línea).
 */
export const HEAT_RAMP = ["#EDE4EA", "#F3C3D3", "#EA8FAC", "#D8557F", "#AF2457", "#6F0C34"] as const;

export type HeatStep = 0 | 1 | 2 | 3 | 4 | 5;

const THRESHOLDS = [15, 30, 45, 60, 75] as const;

export const heatStep = (score: number): HeatStep => {
  const step = THRESHOLDS.filter((limit) => score >= limit).length;
  return Math.min(step, 5) as HeatStep;
};

/** A partir de este escalón el texto encima va en blanco. */
export const isDarkStep = (step: HeatStep): boolean => step >= 4;

export const heatColor = (score: number): string => HEAT_RAMP[heatStep(score)];
