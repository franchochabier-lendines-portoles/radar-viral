import { madridHour } from "@/lib/format";
import { sendDigest } from "@/lib/notify/email";
import { ingest } from "@/lib/pipeline";

const minutes = Number(process.env.INGEST_EVERY_MINUTES ?? 5);
const digestHours = (process.env.DIGEST_HOURS ?? "9,14,20").split(",").map(Number);
let lastDigestKey = "";

const log = (message: string): void => console.log(`[${new Date().toISOString()}] ${message}`);

const runIngest = async (): Promise<void> => {
  try {
    const r = await ingest();
    log(`Ingesta: ${r.stories} historias (${r.failures.length} fuentes fallidas).`);
  } catch (error) {
    log(`Ingesta fallida: ${String(error)}`);
  }
};

const maybeSendDigest = async (): Promise<void> => {
  const now = Date.now();
  const hour = madridHour(now);
  const key = `${new Date(now).toISOString().slice(0, 10)}-${hour}`;
  if (!digestHours.includes(hour) || key === lastDigestKey) return;
  lastDigestKey = key;
  try {
    const outcome = await sendDigest();
    log(`Correo de las ${hour} h: ${outcome.storyCount} historias (${outcome.mode}).`);
  } catch (error) {
    log(`Correo fallido: ${String(error)}`);
  }
};

const tick = async (): Promise<void> => {
  await runIngest();
  await maybeSendDigest();
};

log(`Worker en marcha: ingesta cada ${minutes} min y correo a las ${digestHours.join(", ")} h (Madrid).`);
await tick();
setInterval(() => void tick(), minutes * 60_000);
