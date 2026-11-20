import { tokenize } from "./text";

const MIN_SHARED_TOKENS = 3;
const MIN_OVERLAP = 0.6;

export const sameStory = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => {
  const smaller = a.size <= b.size ? a : b;
  const larger = smaller === a ? b : a;
  if (smaller.size === 0) return false;
  let shared = 0;
  for (const token of smaller) if (larger.has(token)) shared += 1;
  const needed = Math.min(MIN_SHARED_TOKENS, smaller.size);
  return shared >= needed && shared / smaller.size >= MIN_OVERLAP;
};

export type Cluster<T> = { tokens: Set<string>; members: T[] };

/**
 * Agrupa elementos que cuentan la misma historia. El primero de cada grupo hace de
 * referencia, así que conviene pasar la lista ordenada de más a menos relevante.
 */
export const clusterBy = <T>(items: readonly T[], titleOf: (item: T) => string): Array<Cluster<T>> => {
  const clusters: Array<Cluster<T>> = [];
  for (const item of items) {
    const tokens = new Set(tokenize(titleOf(item)));
    const home = clusters.find((cluster) => sameStory(cluster.tokens, tokens));
    if (home) home.members.push(item);
    else clusters.push({ tokens, members: [item] });
  }
  return clusters;
};
