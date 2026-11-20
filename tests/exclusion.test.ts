import { describe, expect, it } from "vitest";
import { checkExclusion, isExcluded } from "@/lib/classify/exclusion";

describe("filtro de política y deportes", () => {
  it.each([
    ["Sánchez y Feijóo chocan en el Congreso por los presupuestos", null],
    ["Elecciones en Galicia: lo que dicen las encuestas", null],
    ["El Real Madrid gana el derbi en el último minuto", null],
    ["Alcaraz se mete en la final de Roland Garros", null],
    ["Starmer faces Labour rebellion over budget vote", null],
    ["Premier League: Arsenal beat Chelsea", null],
    ["Trump launches new campaign app ahead of midterm elections", null],
    ["Macron s'exprime devant l'Assemblée nationale", null],
    ["Le PSG s'impose face à l'OM", null],
    ["El Gobierno aprueba la reforma de la ley de vivienda", "eventos"],
  ] as const)("excluye: %s", (title, topic) => {
    expect(isExcluded(title, topic)).toBe(true);
  });

  it.each([
    ["Cinco plantas de interior que sobreviven al invierno", "jardineria"],
    ["Hallan una carta de 1890 en un desván de Cuenca", "curiosidades"],
    ["Iceland evacuates Grindavik as volcano erupts again", "internacional"],
    ["Le marché de Noël de Strasbourg ouvre avec 300 chalets", "eventos"],
    ["Apple launches iPhone repair kit for UK customers", "novedades"],
  ] as const)("deja pasar: %s", (title, topic) => {
    expect(isExcluded(title, topic)).toBe(false);
  });

  it("tolera el gobierno en Economía si es macroeconomía pura", () => {
    expect(isExcluded("El Gobierno rebaja el IVA de los alimentos", "economia")).toBe(false);
    expect(isExcluded("Government cuts tax on energy bills", "economia")).toBe(false);
  });

  it("no tolera el gobierno en Economía si hay elecciones o partidos", () => {
    expect(isExcluded("El Gobierno rebaja el IVA antes de las elecciones", "economia")).toBe(true);
  });

  it("no confunde palabras parecidas", () => {
    expect(isExcluded("Una ligadura de lianas en el jardín botánico", "jardineria")).toBe(false);
  });

  it("explica por qué excluye", () => {
    expect(checkExclusion("Nadal anuncia su regreso", null)).toMatchObject({ excluded: true, reason: expect.stringContaining("deportes") });
  });
});
