import { NextResponse } from "next/server";
import { sendDigestIfDue } from "@/lib/notify/email";
import { ingestIfStale } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Lo llama GitHub Actions cada hora. Es seguro dejarlo público: solo lee si los datos
 * tienen más de 10 minutos y solo envía el correo una vez en cada hora de envío.
 */
export const GET = async () => {
  const ingest = await ingestIfStale().catch((error: unknown) => ({ error: String(error) }));
  const digest = await sendDigestIfDue().catch((error: unknown) => ({ error: String(error) }));
  return NextResponse.json({
    ingest: ingest ?? "datos recientes, no hacía falta leer",
    digest: digest ? digest : "no es hora de correo",
  });
};
