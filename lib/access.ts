import { NextResponse } from "next/server";

/** Con PUBLIC_READONLY=1 la web es solo de lectura: la ingesta y el correo los lanza el worker. */
export const isReadOnly = (): boolean => process.env.PUBLIC_READONLY === "1";

export const readOnlyResponse = (): NextResponse =>
  NextResponse.json({ message: "Esta copia es solo de lectura: se actualiza sola cada pocos minutos." }, { status: 403 });
