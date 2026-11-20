import type { Topic } from "@/lib/config";
import { findTerms, normalize } from "./text";

/** Palabras que delatan un topic sin ambigüedad, en los tres idiomas. */
const TOPIC_TERMS: Record<Topic, readonly string[]> = {
  internacional: [
    "guerra", "ucrania", "rusia", "gaza", "israel", "china", "onu", "otan", "terremoto", "huracan", "inundacion*",
    "war", "ukraine", "russia", "united nations", "nato", "earthquake", "hurricane", "flood*",
    "guerre", "russie", "seisme", "ouragan",
  ],
  curiosidades: [
    "curios*", "insolit*", "sorprendente", "viral", "record guinness", "extrano", "descubren", "hallazgo",
    "bizarre", "weird", "quirky", "unusual", "guinness", "mystery",
    "insolite", "etonnant", "incroyable", "decouverte",
  ],
  jardineria: [
    "jardin*", "planta*", "huerto*", "poda*", "riego", "semilla*", "flores", "cesped",
    "garden*", "plant", "plants", "houseplant*", "allotment", "lawn", "pruning", "seeds",
    "jardinage", "potager", "plantes", "graines", "tondre",
  ],
  eventos: [
    "festival*", "concierto*", "exposicion*", "feria", "estreno", "gira", "entradas", "navidad", "luces de navidad",
    "concert*", "exhibition", "fair", "premiere", "tour dates", "tickets", "christmas lights",
    "exposition", "salon", "spectacle", "billets",
  ],
  economia: [
    "economia", "inflacion", "ipc", "pib", "bolsa", "ibex", "euribor", "hipoteca*", "salario*", "precio*", "empleo",
    "economy", "inflation", "stocks", "shares", "mortgage*", "wages", "prices", "ftse", "wall street", "dow jones",
    "economie", "bourse", "cac 40", "prix", "salaires",
  ],
  novedades: [
    "lanza", "lanzamiento", "nuevo iphone", "inteligencia artificial", "app", "actualizacion", "smartphone", "movil",
    "launch*", "unveil*", "artificial intelligence", "ai", "update", "gadget", "iphone", "android",
    "lance", "nouveaute", "intelligence artificielle", "mise a jour",
  ],
};

const TOPIC_ENTRIES = Object.entries(TOPIC_TERMS) as Array<[Topic, readonly string[]]>;

/** Devuelve el topic solo si una única categoría encaja; si no, null. */
export const classifyTopic = (title: string): Topic | null => {
  const text = normalize(title);
  const matches = TOPIC_ENTRIES.filter(([, terms]) => findTerms(text, terms).length > 0).map(([topic]) => topic);
  return matches.length === 1 ? (matches[0] ?? null) : null;
};
