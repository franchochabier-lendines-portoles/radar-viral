import { sendDigest, sendDigestIfDue } from "@/lib/notify/email";

// "npm run digest -- --si-toca" solo envía si es hora de envío (lo usa GitHub Actions).
const args = process.argv.slice(2);
const onlyIfDue = args.includes("--si-toca");
const recipients = args.filter((a) => !a.startsWith("--"));

const outcome = onlyIfDue ? await sendDigestIfDue() : await sendDigest(recipients);
if (!outcome) {
  console.log("No es hora de correo.");
} else {
  const where = outcome.mode === "smtp" ? `enviado a ${outcome.recipients}` : `simulado${outcome.file ? `, guardado en ${outcome.file}` : ", guardado en la base"}`;
  console.log(`Correo con ${outcome.storyCount} historias ${where}.`);
}
