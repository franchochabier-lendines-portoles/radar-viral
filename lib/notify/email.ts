import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import nodemailer from "nodemailer";
import { isDemo, listCurrentStories, recordDigest } from "@/lib/db/repository";
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

export const buildDigest = (sentAt = Date.now()): { subject: string; html: string; storyCount: number } => {
  const selection = selectForDigest(listCurrentStories({}));
  const input = { selection, sentAt, demo: isDemo(), dashboardUrl: process.env.DASHBOARD_URL ?? null };
  return {
    subject: digestSubject(input),
    html: renderDigest(input),
    storyCount: selection.reduce((sum, g) => sum + g.stories.length, 0),
  };
};

const saveToOutbox = (sentAt: number, html: string): string => {
  mkdirSync(OUTBOX, { recursive: true });
  const file = join(OUTBOX, `radar-${new Date(sentAt).toISOString().replace(/[:.]/g, "-")}.html`);
  writeFileSync(file, html, "utf8");
  return file;
};

/** Envía el correo por SMTP; sin SMTP lo guarda en data/outbox (modo simulado). */
export const sendDigest = async (explicitRecipients: readonly string[] = []): Promise<DigestOutcome> => {
  const sentAt = Date.now();
  const { subject, html, storyCount } = buildDigest(sentAt);
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
  recordDigest(outcome);
  return outcome;
};
