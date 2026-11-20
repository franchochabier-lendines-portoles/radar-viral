import { ingest } from "@/lib/pipeline";

const result = await ingest();
console.log(`${result.stories} historias de ${result.items} titulares y ${result.trends} tendencias en ${result.tookMs} ms.`);
if (result.failures.length > 0) console.warn(`Fuentes que fallaron (${result.failures.length}):\n  ${result.failures.join("\n  ")}`);
