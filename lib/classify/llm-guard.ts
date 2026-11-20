import Anthropic from "@anthropic-ai/sdk";
import type { Story } from "@/lib/types";

const MODEL = "claude-haiku-4-5";
const BATCH = 60;

const PROMPT = `Eres un filtro editorial. Recibes titulares numerados. Devuelve SOLO los números de los que traten de política (partidos, elecciones, gobiernos, parlamentos, políticos) o de deportes (competiciones, equipos, deportistas), separados por comas. Si ninguno, responde "ninguno".`;

const parseIndexes = (text: string): Set<number> =>
  new Set(
    (text.match(/\d+/g) ?? []).map(Number).filter((n) => Number.isInteger(n)),
  );

/**
 * Segunda barrera opcional con Claude. Solo actúa si hay ANTHROPIC_API_KEY; si la
 * llamada falla, se queda con lo que ya filtraron las reglas.
 */
export const llmGuard = async (stories: Story[]): Promise<Story[]> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || stories.length === 0) return stories;
  const client = new Anthropic({ apiKey });
  const kept: Story[] = [];

  for (let start = 0; start < stories.length; start += BATCH) {
    const batch = stories.slice(start, start + BATCH);
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 300,
        system: PROMPT,
        messages: [{ role: "user", content: batch.map((s, i) => `${i + 1}. ${s.title}`).join("\n") }],
      });
      const text = message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
      const rejected = parseIndexes(text);
      kept.push(...batch.filter((_, i) => !rejected.has(i + 1)));
    } catch (error) {
      console.warn("[llm-guard] sin filtro de IA en este lote:", String(error));
      kept.push(...batch);
    }
  }
  return kept;
};
