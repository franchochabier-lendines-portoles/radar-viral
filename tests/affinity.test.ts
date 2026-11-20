import { describe, expect, it } from "vitest";
import { matchThemes } from "@/lib/classify/affinity";
import { isExcluded } from "@/lib/classify/exclusion";
import { processItems } from "@/lib/classify/process";

describe("perfil editorial", () => {
  it.each([
    ["Los chefs expertos coinciden: para que la tortilla de patatas quede jugosa", "cocina"],
    ["Hacienda lo hace oficial: los mayores de 65 pueden donar la casa a sus hijos sin pagar IRPF", "dinero"],
    ["Los veterinarios coinciden: los gatos eligen a la persona que respeta sus límites", "mascotas"],
    ["La AEMET desactiva las alertas por la DANA en la Comunidad Valenciana", "tiempo"],
    ["El BOE lo confirma: habrá puente por el festivo del 1 de noviembre", "calendario"],
    ["Uso del vinagre en el cajetín de la lavadora", "hogar"],
    ["La psicología sugiere que los adultos que bajan la mirada no lo hacen por timidez", "psicologia"],
    ["Los mecánicos expertos lo confirman: ésta es la presión de los neumáticos", "motor"],
  ] as const)("reconoce el tema de: %s", (title, theme) => {
    expect(matchThemes(title, "es")).toContain(theme);
  });

  it("funciona en inglés y francés", () => {
    expect(matchThemes("Vets warn dog owners about conkers", "en")).toContain("mascotas");
    expect(matchThemes("Retraite : la revalorisation des pensions confirmée", "fr")).toContain("dinero");
  });

  it("deja fuera lo que no es de la línea", () => {
    expect(matchThemes("Iceland evacuates Grindavik as volcano erupts again", "en")).toEqual([]);
  });

  it("Hacienda en noticias de finanzas personales no cuenta como política", () => {
    expect(isExcluded("Hacienda multa a quien saque dinero del cajero de esta forma", "economia")).toBe(false);
    expect(isExcluded("Hacienda y el Gobierno pactan con el PSOE los presupuestos", "economia")).toBe(true);
  });

  it("las historias guardan sus temas", () => {
    const now = Date.now();
    const [story] = processItems(
      [
        {
          country: "ES",
          topicHint: null,
          title: "Los veterinarios coinciden: los perros que te siguen al baño no lo hacen por curiosidad",
          url: "https://x.es/a",
          sourceName: "X",
          sourceDomain: "x.es",
          publishedAt: now - 1000,
          feedPosition: 0,
          feedSize: 5,
        },
      ],
      [],
      [],
      now,
    );
    expect(story?.themes[0]).toBe("mascotas");
    expect(story?.topic).toBe("curiosidades");
  });
});
