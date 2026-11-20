import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { COUNTRIES, type Country } from "@/lib/config";
import type { RawItem, TrendingSearch } from "@/lib/types";
import { buildFeeds, trendsFeedUrl, type Feed } from "./feeds";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

const TIMEOUT_MS = 12_000;
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
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value["#text"] ?? "");
};

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} en ${url}`);
  return response.text();
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
  const sourceName = typeof source === "string" ? source : String(source?.["#text"] ?? "");
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

  const feedResults = await Promise.allSettled(feeds.map(fetchFeed));
  const items = feedResults.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    failures.push(`${feeds[index]?.label ?? "feed"}: ${String(result.reason)}`);
    return [];
  });

  const trendResults = await Promise.allSettled(COUNTRIES.map(fetchTrends));
  const trends = trendResults.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    failures.push(`Tendencias ${COUNTRIES[index] ?? ""}: ${String(result.reason)}`);
    return [];
  });

  return { items, trends, failures };
};
