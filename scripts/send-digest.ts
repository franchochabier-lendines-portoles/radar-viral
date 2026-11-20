import { sendDigest } from "@/lib/notify/email";

const outcome = await sendDigest(process.argv.slice(2));
const where = outcome.mode === "smtp" ? `enviado a ${outcome.recipients}` : `simulado, guardado en ${outcome.file}`;
console.log(`Correo con ${outcome.storyCount} historias ${where}.`);
