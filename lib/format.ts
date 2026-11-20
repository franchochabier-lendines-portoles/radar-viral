const TZ = "Europe/Madrid";

export const formatTime = (at: number): string =>
  new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(at);

export const formatDateTime = (at: number): string =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(at);

export const timeAgo = (at: number, now = Date.now()): string => {
  const minutes = Math.max(0, Math.round((now - at) / 60_000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "hace 1 h" : `hace ${hours} h`;
};

export const formatTraffic = (traffic: number): string => {
  if (traffic >= 1_000_000) return `${Math.round(traffic / 1_000_000)} M`;
  if (traffic >= 1_000) return `${Math.round(traffic / 1_000)} mil`;
  return traffic > 0 ? String(traffic) : "";
};

export const madridHour = (at: number): number =>
  Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: TZ }).format(at));
