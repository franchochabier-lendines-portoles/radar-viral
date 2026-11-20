import { NextResponse } from "next/server";
import { isReadOnly, readOnlyResponse } from "@/lib/access";
import { ingest } from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const POST = async () => {
  if (isReadOnly()) return readOnlyResponse();
  try {
    const result = await ingest();
    const failed = result.failures.length > 0 ? ` (${result.failures.length} fuentes no respondieron)` : "";
    return NextResponse.json({ ...result, message: `Leídas ${result.stories} historias${failed}.` });
  } catch (error) {
    return NextResponse.json({ message: `No se pudieron leer las fuentes: ${String(error)}` }, { status: 502 });
  }
};
