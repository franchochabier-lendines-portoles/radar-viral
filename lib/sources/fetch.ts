import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { COUNTRIES, type Country } from "@/lib/config";
import type { RawItem, TrendingSearch } from "@/lib/types";
import { buildFeeds, trendsFeedUrl, type Feed } from "./feeds";

/**
 * Sin expansión de entidades: las descripciones HTML de Google News traen miles de
 * "&lt;" y superan el tope de seguridad del parser. Solo decodificamos los campos
 * que usamos (titular, medio, enlace) con decodeEntities.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  processEntities: false,
  htmlEntities: false,
});

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith("#")) return String.fromCodePoint(Number(code.slice(1)));
    return NAMED_ENTITIES[code.toLowerCase()] ?? whole;
  });

const TIMEOUT_MS = 12_000;
/** Peticiones simultáneas a Google: más de unas pocas a la vez devuelve HTTP 429. */
const CONCURRENCY = 3;
const PAUSE_MS = 250;
const RETRY_DELAYS_MS = [2_000, 6_000];
const USER_AGENT = "Mozilla/5.0 (compatible; RadarViral/2.0)";

const textOf = z.union([z.string(), z.number(), z.object({ "#text": z.union([z.string(), z.number()]).optional() }).passthrough()]);

const rssItemSchema = z
  .object({
    title: textOf.optional(),
    link: textOf.optional(),
    pubDate: z.string().optional(),
    source: z.union([z.string(), z.object({ "#text": z.string().optional(), "@_url": z.string().optional() }).passthrough()]).optional(),
    "ht:approx_traffic": z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

type RssItem = z.infer<typeof rssItemSchema>;

const toText = (value: RssItem["title"]): string => {
  if (value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return decodeEntities(String(value));
  return decodeEntities(String(value["#text"] ?? ""));
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Descarga con reintentos si Google responde 429 (demasiadas peticiones) o 5xx. */
const fetchText = async (url: string): Promise<string> => {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, "accept-language": "es-ES,es;q=0.9,en;q=0.8,fr;q=0.7" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) return response.text();
    const retryable = response.status === 429 || response.status >= 500;
    const delay = RETRY_DELAYS_MS[attempt];
    if (!retryable || delay === undefined) throw new Error(`HTTP ${response.status} en ${url}`);
    const retryAfter = Number(response.headers.get("retry-after")) * 1000;
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 30_000) : delay);
  }
};

/** Como Promise.allSettled, pero con un máximo de tareas a la vez y una pausa entre ellas. */
const settleWithLimit = async <T, R>(items: readonly T[], task: (item: T) => Promise<R>): Promise<Array<PromiseSettledResult<R>>> => {
  const results: Array<PromiseSettledResult<R>> = new Array(items.length);
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < items.length) {
      const index = next;
      next += 1;
      const item = items[index] as T;
      try {
        results[index] = { status: "fulfilled", value: await task(item) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
      await sleep(PAUSE_MS);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, lane));
  return results;
};

const parseItems = (xml: string): RssItem[] => {
  const doc: unknown = parser.parse(xml);
  const channel = z.object({ rss: z.object({ channel: z.object({ item: z.unknown().optional() }).passthrough() }) }).safeParse(doc);
  if (!channel.success) return [];
  const raw = channel.data.rss.channel.item;
  const list = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
  return list.flatMap((entry) => {
    const parsed = rssItemSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
};

const hostnameOf = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

/** Google News añade " - Medio" al final del titular. */
const stripOutletSuffix = (title: string, sourceName: string): string => {
  const suffix = ` - ${sourceName}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title.trim();
};

const toRawItem = (feed: Feed, item: RssItem, position: number, size: number): RawItem | null => {
  const source = item.source;
  const sourceName = decodeEntities(typeof source === "string" ? source : String(source?.["#text"] ?? ""));
  const sourceUrl = typeof source === "object" ? source["@_url"] : undefined;
  const title = stripOutletSuffix(toText(item.title), sourceName);
  const url = toText(item.link);
  if (!title || !url) return null;
  const published = item.pubDate ? Date.parse(item.pubDate) : Date.now();
  return {
    country: feed.country,
    topicHint: feed.topicHint,
    title,
    url,
    sourceName: sourceName || "Desconocido",
    sourceDomain: hostnameOf(sourceUrl),
    publishedAt: Number.isNaN(published) ? Date.now() : published,
    feedPosition: position,
    feedSize: size,
  };
};

export const fetchFeed = async (feed: Feed): Promise<RawItem[]> => {
  const items = parseItems(await fetchText(feed.url));
  return items.flatMap((item, index) => {
    const raw = toRawItem(feed, item, index, items.length);
    return raw ? [raw] : [];
  });
};

const parseTraffic = (value: string | number | undefined): number => {
  if (value === undefined) return 0;
  const match = /([\d.,]+)\s*([KkMm])?/.exec(String(value));
  if (!match?.[1]) return 0;
  const base = Number(match[1].replace(/[.,]/g, ""));
  const unit = match[2]?.toUpperCase();
  return unit === "M" ? base * 1_000_000 : unit === "K" ? base * 1_000 : base;
};

export const fetchTrends = async (country: Country): Promise<TrendingSearch[]> => {
  const items = parseItems(await fetchText(trendsFeedUrl(country)));
  return items
    .map((item) => ({ country, query: toText(item.title), traffic: parseTraffic(item["ht:approx_traffic"]) }))
    .filter((trend) => trend.query.length > 0);
};

export type FetchReport = { items: RawItem[]; trends: TrendingSearch[]; failures: string[] };

/** Lee todas las fuentes en paralelo. Una fuente caída no tumba la ingesta. */
export const fetchAll = async (): Promise<FetchReport> => {
  const feeds = buildFeeds();
  const failures: string[] = [];

  const feedResults = await settleWithLimit(feeds, fetchFeed);
  const items = feedResults.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    failures.push(`${feeds[index]?.label ?? "feed"}: ${String(result.reason)}`);
    return [];
  });

  const trendResults = await settleWithLimit(COUNTRIES, fetchTrends);
  const trends = trendResults.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    failures.push(`Tendencias ${COUNTRIES[index] ?? ""}: ${String(result.reason)}`);
    return [];
  });

  return { items, trends, failures };
};
