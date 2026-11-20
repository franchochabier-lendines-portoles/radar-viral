import type { Topic } from "@/lib/config";
import { findTerms, normalize } from "./text";

/** Términos de política que nunca se toleran. Ya normalizados (sin tildes). */
const HARD_POLITICS = [
  // es
  "eleccion*", "electoral*", "votacion*", "votante*", "diputad*", "senador*", "senado", "congreso de los diputados",
  "parlament*", "partido popular", "partido socialista", "psoe", "pp", "vox", "sumar", "unidas podemos", "moncloa",
  "sanchez", "feijoo", "abascal", "ayuso", "puigdemont", "yolanda diaz", "amnistia", "investidura", "mocion de censura",
  "campana electoral", "mitin", "oposicion", "coalicion", "alcalde*", "alcaldesa*", "referendum", "president del govern",
  "presidente del gobierno", "consejo de ministros", "izquierda", "derecha", "ultraderecha",
  // en
  "election*", "voter*", "ballot*", "senate", "senator*", "congress", "congressman", "congresswoman", "parliament*",
  "prime minister", "labour party", "tory", "tories", "conservative party", "republican*", "democrat*", "gop", "trump",
  "biden", "harris", "vance", "starmer", "sunak", "farage", "reform uk", "white house", "downing street", "impeachment",
  "campaign trail", "polls", "lawmaker*", "mayor", "governor*",
  // fr
  "elysee", "macron", "le pen", "melenchon", "bardella", "assemblee nationale", "depute*", "legislatives", "municipales",
  "presidentielle*", "scrutin", "premier ministre", "matignon", "rassemblement national", "insoumis*",
] as const;

/** Gobierno "a secas": se tolera en Economía si la noticia es macroeconómica pura. */
const SOFT_GOVERNMENT = [
  "gobierno", "ministro*", "ministra*", "ministerio", "hacienda", "government", "minister*", "ministry", "treasury",
  "chancellor", "gouvernement", "ministre*", "bercy",
] as const;

const MACRO_TERMS = [
  "tipos de interes", "inflacion", "ipc", "pib", "arancel*", "impuesto*", "iva", "irpf", "bce", "deuda publica", "paro",
  "interest rate*", "inflation", "gdp", "tariff*", "tax", "taxes", "fed", "bank of england", "budget deficit", "unemployment",
  "taux", "droits de douane", "impot*", "croissance", "chomage",
  // finanzas personales: el tipo de noticia de Hacienda/pensiones que sí interesa
  "jubilacion", "jubilad*", "pension*", "herencia*", "declaracion de la renta", "seguridad social", "cajero", "efectivo",
  "multa*", "cotiz*", "ibi", "boe", "retire*", "state pension", "inheritance", "savings", "retraite*", "heritage",
] as const;

const SPORTS = [
  // es
  "futbol*", "liga", "laliga", "champions", "real madrid", "fc barcelona", "barca", "atletico de madrid", "gol", "goles",
  "jugador*", "entrenador*", "seleccion espanola", "mundial de futbol", "tenis", "nadal", "alcaraz", "baloncesto", "acb",
  "formula 1", "f1", "motogp", "ciclismo", "tour de francia", "olimpic*", "fichaje*", "estadio bernabeu", "copa del rey",
  "partido", "derbi", "atletismo", "balonmano", "maraton",
  // en
  "football", "soccer", "premier league", "rugby", "cricket", "tennis", "wimbledon", "nba", "nfl", "mlb", "nhl",
  "super bowl", "quarterback", "touchdown", "transfer window", "golf", "boxing", "ufc", "olympic*", "athletics",
  "marathon", "playoff*", "championship", "match", "striker", "midfielder", "coach", "messi", "ronaldo", "lebron",
  // fr
  "ligue 1", "psg", "olympique", "mbappe", "coupe du monde", "boxe", "cyclisme", "joueur*", "entraineur*", "rolland garros",
  "roland garros", "grand prix",
] as const;

export type ExclusionResult = { excluded: false } | { excluded: true; reason: string };

const KEEP: ExclusionResult = { excluded: false };

export const checkExclusion = (title: string, topic: Topic | null): ExclusionResult => {
  const text = normalize(title);

  const sport = findTerms(text, SPORTS);
  if (sport.length > 0) return { excluded: true, reason: `deportes: ${sport.join(", ")}` };

  const hard = findTerms(text, HARD_POLITICS);
  if (hard.length > 0) return { excluded: true, reason: `política: ${hard.join(", ")}` };

  const soft = findTerms(text, SOFT_GOVERNMENT);
  if (soft.length === 0) return KEEP;

  const isPureMacro = topic === "economia" && findTerms(text, MACRO_TERMS).length > 0;
  return isPureMacro ? KEEP : { excluded: true, reason: `política: ${soft.join(", ")}` };
};

export const isExcluded = (title: string, topic: Topic | null): boolean => checkExclusion(title, topic).excluded;
