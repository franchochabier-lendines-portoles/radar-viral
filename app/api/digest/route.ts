import { NextResponse } from "next/server";
import { isReadOnly, readOnlyResponse } from "@/lib/access";
import { z } from "zod";
import { sendDigest } from "@/lib/notify/email";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ to: z.array(z.string().email()).optional() });

export const POST = async (request: Request) => {
  if (isReadOnly()) return readOnlyResponse();
  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  try {
    const outcome = await sendDigest(body.success ? (body.data.to ?? []) : []);
    const message =
      outcome.mode === "smtp"
        ? `Correo enviado a ${outcome.recipients}.`
        : "Correo simulado: falta configurar SMTP. Lo tienes en Ver el correo.";
    return NextResponse.json({ ...outcome, message });
  } catch (error) {
    return NextResponse.json({ message: String(error instanceof Error ? error.message : error) }, { status: 400 });
  }
};
