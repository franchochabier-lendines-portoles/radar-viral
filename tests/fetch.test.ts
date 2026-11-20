import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeEntities, fetchFeed } from "@/lib/sources/fetch";

const heavyDescription = "&lt;a href=&quot;x&quot;&gt;y&lt;/a&gt;".repeat(400);
const item = (n: number) =>
  `<item><title>Titular &amp; número ${n} - Medio</title><link>https://news.google.com/a/${n}</link><pubDate>Thu, 19 Nov 2026 10:00:00 GMT</pubDate><description>${heavyDescription}</description><source url="https://www.elmundo.es">Medio</source></item>`;
const xml = `<?xml version="1.0"?><rss><channel>${[1, 2, 3].map(item).join("")}</channel></rss>`;

afterEach(() => vi.unstubAllGlobals());

describe("lectura de feeds", () => {
  it("lee feeds con miles de entidades HTML sin romperse", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(xml, { status: 200 })));
    const items = await fetchFeed({ country: "ES", topicHint: "internacional", url: "https://x", label: "x" });
    expect(items).toHaveLength(3);
    expect(items[0]?.title).toBe("Titular & número 1");
    expect(items[0]?.sourceDomain).toBe("elmundo.es");
  });

  it("reintenta cuando Google responde 429", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(new Response(xml, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const pending = fetchFeed({ country: "ES", topicHint: null, url: "https://x", label: "x" });
    await vi.runAllTimersAsync();
    expect(await pending).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("decodifica entidades con nombre y numéricas", () => {
    expect(decodeEntities("Tom &amp; Jerry &#39;hoy&#39; &#x27;ya&#x27;")).toBe("Tom & Jerry 'hoy' 'ya'");
  });
});
