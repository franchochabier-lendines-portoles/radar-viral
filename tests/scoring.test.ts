import { describe, expect, it } from "vitest";
import { findSpanishOutlet, outletIdOf } from "@/lib/classify/outlets";
import { processItems } from "@/lib/classify/process";
import { classifyTopic } from "@/lib/classify/topics";
import { coverageScore, freshnessScore, trendScore, viralScore } from "@/lib/classify/virality";
import type { RawItem } from "@/lib/types";

const NOW = Date.UTC(2026, 10, 19, 12);

const item = (over: Partial<RawItem>): RawItem => ({
  country: "ES",
  topicHint: "jardineria",
  title: "Cinco plantas de interior que sobreviven al invierno sin luz",
  url: "https://example.com/a",
  sourceName: "Ejemplo",
  sourceDomain: "example.com",
  publishedAt: NOW - 3_600_000,
  feedPosition: 0,
  feedSize: 10,
  ...over,
});

describe("puntuación", () => {
  it("la cobertura crece con los medios y se satura", () => {
    expect(coverageScore(1)).toBe(0);
    expect(coverageScore(8)).toBe(1);
    expect(coverageScore(20)).toBe(1);
  });

  it("la frescura se reduce a la mitad cada 4 horas", () => {
    expect(freshnessScore(NOW, NOW)).toBe(1);
    expect(freshnessScore(NOW - 4 * 3_600_000, NOW)).toBeCloseTo(0.5);
  });

  it("detecta coincidencias con las tendencias", () => {
    const match = trendScore("El euríbor cae por debajo del 2%", [{ country: "ES", query: "euribor", traffic: 1000 }]);
    expect(match.query).toBe("euribor");
    expect(match.score).toBeGreaterThan(0.5);
  });

  it("el índice va de 0 a 100", () => {
    expect(viralScore({ coverage: 1, trend: 1, freshness: 1, position: 1 })).toBe(100);
    expect(viralScore({ coverage: 0, trend: 0, freshness: 0, position: 0 })).toBe(0);
  });
});

describe("medios", () => {
  it("reconoce medios españoles por dominio y por nombre", () => {
    expect(findSpanishOutlet("okdiario.com", "x")?.name).toBe("OKDIARIO");
    expect(findSpanishOutlet("www.elmundo.es".replace("www.", ""), "")?.id).toBe("elmundo");
    expect(findSpanishOutlet(null, "El País")?.id).toBe("elpais");
    expect(outletIdOf("bbc.co.uk", "BBC")).toBe("bbc.co.uk");
  });
});

describe("procesado", () => {
  it("agrupa la misma historia contada por varios medios y sabe quién fue primero", () => {
    const stories = processItems(
      [
        item({ sourceName: "El Mundo", sourceDomain: "elmundo.es", publishedAt: NOW - 2 * 3_600_000 }),
        item({ sourceName: "OKDIARIO", sourceDomain: "okdiario.com", topicHint: null, title: "Cinco plantas de interior que sobreviven al invierno con poca luz" }),
        item({ title: "Cómo podar rosales en noviembre", sourceName: "ABC", sourceDomain: "abc.es" }),
      ],
      [],
      [],
      NOW,
    );
    expect(stories).toHaveLength(2);
    const plants = stories.find((s) => s.title.includes("plantas"));
    expect(plants?.coverage).toHaveLength(2);
    expect(plants?.firstPublisher.name).toBe("El Mundo");
  });

  it("nunca deja pasar política ni deportes", () => {
    const stories = processItems([item({ title: "El Real Madrid gana el derbi", topicHint: "curiosidades" })], [], [], NOW);
    expect(stories).toHaveLength(0);
  });

  it("solo clasifica un topic si no hay ambigüedad", () => {
    expect(classifyTopic("Potager d'hiver : ce qu'il faut semer")).toBe("jardineria");
    expect(classifyTopic("Hola mundo")).toBeNull();
  });
});
