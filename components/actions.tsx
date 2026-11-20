"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";

const AUTO_REFRESH_MS = 60_000;

/** Vuelve a pedir los datos al servidor cada minuto mientras la pestaña está visible. */
export const AutoRefresh = () => {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [router]);
  return null;
};

type Status = { tone: "ok" | "error"; text: string } | null;

const postJson = async (url: string): Promise<{ ok: boolean; message: string }> => {
  const response = await fetch(url, { method: "POST" });
  const body: unknown = await response.json().catch(() => ({}));
  const message = typeof body === "object" && body !== null && "message" in body && typeof body.message === "string" ? body.message : "";
  return { ok: response.ok, message };
};

const useAction = (url: string) => {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [, startTransition] = useTransition();

  const run = async (): Promise<void> => {
    setRunning(true);
    setStatus(null);
    try {
      const { ok, message } = await postJson(url);
      setStatus({ tone: ok ? "ok" : "error", text: message });
      if (ok) startTransition(() => router.refresh());
    } catch {
      setStatus({ tone: "error", text: "No hay conexión con el servidor." });
    } finally {
      setRunning(false);
    }
  };
  return { running, status, run };
};

const buttonBase =
  "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60";

export const Toolbar = ({ readOnly }: { readOnly: boolean }) => {
  const refresh = useAction("/api/ingest");
  const digest = useAction("/api/digest");
  const status = digest.status ?? refresh.status;

  if (readOnly) {
    return (
      <a href="/api/digest/preview" target="_blank" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        Ver el último correo
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={refresh.run} disabled={refresh.running} className={cn(buttonBase, "bg-ink text-white hover:bg-ink/85")}>
        {refresh.running ? "Leyendo fuentes…" : "Actualizar"}
      </button>
      <button
        type="button"
        onClick={digest.run}
        disabled={digest.running}
        className={cn(buttonBase, "border border-ink/20 bg-surface hover:bg-white")}
      >
        {digest.running ? "Enviando…" : "Enviar correo ahora"}
      </button>
      <a href="/api/digest/preview" target="_blank" className="px-2 text-sm text-muted underline underline-offset-4 hover:text-ink">
        Ver el correo
      </a>
      <p role="status" className={cn("w-full text-sm sm:w-auto", status?.tone === "error" ? "text-rise" : "text-muted")}>
        {status?.text}
      </p>
    </div>
  );
};
