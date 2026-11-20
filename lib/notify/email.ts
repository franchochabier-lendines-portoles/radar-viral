import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import nodemailer from "nodemailer";
import { isDemo, lastDigestAt, listCurrentStories, recordDigest } from "@/lib/db/repository";
import { madridHour } from "@/lib/format";
import type { DigestRecord } from "@/lib/types";
import { selectForDigest } from "./select";
import { digestSubject, renderDigest } from "./template";

const OUTBOX = resolve("data/outbox");

export type DigestOutcome = Omit<DigestRecord, "id"> & { subject: string; file: string | null };

const smtpConfigured = (): boolean => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const parseRecipients = (explicit: readonly string[]): string[] => {
  const list = explicit.length > 0 ? explicit : (process.env.MAIL_TO ?? "").split(",");
  return list.map((r) => r.trim()).filter((r) => r.includes("@"));
};

export const buildDigest = async (sentAt = Date.now()): Promise<{ subject: string; html: string; storyCount: number }> => {
  const selection = selectForDigest(await listCurrentStories({}));
  const input = { selection, sentAt, demo: await isDemo(), dashboardUrl: process.env.DASHBOARD_URL ?? null };
  return {
    subject: digestSubject(input),
    html: renderDigest(input),
    storyCount: selection.reduce((sum, g) => sum + g.stories.length, 0),
  };
};

/** En local deja una copia en data/outbox; en la nube (sin disco) solo queda en la base. */
const saveToOutbox = (sentAt: number, html: string): string | null => {
  if (process.env.TURSO_DATABASE_URL) return null;
  mkdirSync(OUTBOX, { recursive: true });
  const file = join(OUTBOX, `radar-${new Date(sentAt).toISOString().replace(/[:.]/g, "-")}.html`);
  writeFileSync(file, html, "utf8");
  return file;
};

/** Envía el correo por SMTP; sin SMTP lo guarda en data/outbox (modo simulado). */
export const sendDigest = async (explicitRecipients: readonly string[] = []): Promise<DigestOutcome> => {
  const sentAt = Date.now();
  const { subject, html, storyCount } = await buildDigest(sentAt);
  if (storyCount === 0) throw new Error("No hay historias que enviar. Lanza una ingesta primero.");

  const recipients = parseRecipients(explicitRecipients);
  const file = saveToOutbox(sentAt, html);
  const canSend = smtpConfigured() && recipients.length > 0;

  if (canSend) {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: process.env.MAIL_FROM ?? process.env.SMTP_USER, to: recipients, subject, html });
  }

  const outcome: DigestOutcome = {
    sentAt,
    recipients: recipients.join(", ") || "sin destinatarios",
    mode: canSend ? "smtp" : "simulado",
    storyCount,
    subject,
    file,
  };
  await recordDigest({ ...outcome, html });
  return outcome;
};

const DIGEST_HOURS = (process.env.DIGEST_HOURS ?? "9,14,20").split(",").map(Number);

/** Envía el correo solo si ahora es una de las horas de envío (Madrid) y no salió ya en esta hora. */
export const sendDigestIfDue = async (now = Date.now()): Promise<DigestOutcome | null> => {
  if (!DIGEST_HOURS.includes(madridHour(now))) return null;
  const last = await lastDigestAt();
  if (last !== null && now - last < 50 * 60_000) return null;
  return sendDigest();
};
