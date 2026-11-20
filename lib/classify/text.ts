/** Minúsculas, sin tildes y solo letras/números separados por un espacio. */
export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñç]+/g, " ")
    .trim();

const STOPWORDS = new Set(
  (
    "el la los las un una unos unas de del al y o en con por para que se su sus es son lo como mas pero sin sobre tras ante entre hasta desde este esta estos estas ese esa " +
    "the a an of to in on for and or with by at from is are was were be been its it this that these those as after over into new says said " +
    "le la les un une des du de et ou en avec pour par sur dans au aux est sont ce cette ces qui que se sa son ses plus apres"
  ).split(" "),
);

export const tokenize = (text: string): string[] =>
  normalize(text)
    .split(" ")
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

/**
 * Busca términos como palabra completa. Un término que termina en "*" es un prefijo
 * ("eleccion*" encaja con "elecciones"). Los términos pueden tener varias palabras.
 */
export const findTerms = (normalizedText: string, terms: readonly string[]): string[] => {
  const padded = ` ${normalizedText} `;
  return terms.filter((term) => {
    if (!term.endsWith("*")) return padded.includes(` ${term} `);
    return padded.includes(` ${term.slice(0, -1)}`);
  });
};
