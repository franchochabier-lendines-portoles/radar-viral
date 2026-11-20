import { COUNTRY_INFO, TOPIC_LABEL } from "@/lib/config";
import { formatTime } from "@/lib/format";
import { THEME_BY_ID } from "@/lib/profile";
import { heatColor, heatStep, isDarkStep } from "@/lib/heat";
import type { Story } from "@/lib/types";
import type { DigestSelection } from "./select";

const INK = "#18203A";
const MUTED = "#586179";
const PAPER = "#E9EDF1";
const SURFACE = "#F8FAFC";
const RULE = "#D3D9E1";
const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
const SANS = "'Bricolage Grotesque', 'Segoe UI', Helvetica, Arial, sans-serif";

const escape = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const scoreBadge = (score: number): string => {
  const step = heatStep(score);
  const color = isDarkStep(step) ? "#FFFFFF" : INK;
  return `<td width="52" valign="top" style="padding:14px 0 14px 0;">
    <div style="width:44px;height:44px;border-radius:6px;background:${heatColor(score)};color:${color};font:700 18px/44px ${SANS};text-align:center;">${score}</div>
  </td>`;
};

const storyRow = (story: Story): string => {
  const others = story.coverage.filter((c) => c.outletId !== story.outlet.outletId).slice(0, 4);
  const firstNote =
    story.firstPublisher.outletId === story.outlet.outletId
      ? "La publicó primero"
      : `Primero: <a href="${escape(story.firstPublisher.url)}" style="color:${MUTED};">${escape(story.firstPublisher.name)}</a> a las ${formatTime(story.firstPublisher.publishedAt)}`;
  const alsoIn =
    others.length > 0
      ? ` &nbsp;También en ${others.map((c) => `<a href="${escape(c.url)}" style="color:${MUTED};">${escape(c.name)}</a>`).join(", ")}`
      : "";
  return `<tr>
    ${scoreBadge(story.score)}
    <td valign="top" style="padding:14px 0;border-bottom:1px solid ${RULE};">
      <div style="font:500 13px/18px ${SANS};color:${MUTED};">${story.themes[0] ? THEME_BY_ID[story.themes[0]].label : TOPIC_LABEL[story.topic]} en ${escape(story.outlet.name)}</div>
      <a href="${escape(story.url)}" style="display:block;margin-top:2px;font:600 19px/25px ${SERIF};color:${INK};text-decoration:none;">${escape(story.title)}</a>
      <div style="margin-top:6px;font:400 13px/19px ${SANS};color:${MUTED};">${firstNote}.${alsoIn}</div>
    </td>
  </tr>`;
};

export type DigestTemplateInput = { selection: DigestSelection; sentAt: number; demo: boolean; dashboardUrl: string | null };

export const digestSubject = ({ selection, sentAt }: Pick<DigestTemplateInput, "selection" | "sentAt">): string => {
  const lead = selection.flatMap((g) => g.stories).sort((a, b) => b.score - a.score)[0];
  const headline = lead ? `: ${lead.title}` : "";
  return `Radar viral de las ${formatTime(sentAt)}${headline}`.slice(0, 140);
};

export const renderDigest = ({ selection, sentAt, demo, dashboardUrl }: DigestTemplateInput): string => {
  const total = selection.reduce((sum, g) => sum + g.stories.length, 0);
  const groups = selection
    .map(
      ({ country, stories }) => `
      <tr><td colspan="2" style="padding:28px 0 4px 0;font:700 22px/28px ${SANS};color:${INK};">${COUNTRY_INFO[country].name}</td></tr>
      ${stories.map(storyRow).join("")}`,
    )
    .join("");
  const demoNote = demo
    ? `<p style="margin:0 0 16px 0;padding:10px 14px;border-radius:6px;background:#FFF4D6;font:500 13px/19px ${SANS};color:${INK};">Datos de demo: titulares inventados para probar el correo.</p>`
    : "";
  const cta = dashboardUrl
    ? `<p style="margin:28px 0 0 0;"><a href="${escape(dashboardUrl)}" style="display:inline-block;padding:12px 20px;border-radius:6px;background:${INK};color:#FFFFFF;font:600 14px/20px ${SANS};text-decoration:none;">Abrir el radar</a></p>`
    : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Radar viral</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:${SURFACE};border-radius:10px;">
        <tr><td style="padding:28px 28px 32px 28px;">
          <div style="font:700 28px/32px ${SANS};color:${INK};">Radar viral</div>
          <div style="margin:6px 0 20px 0;font:400 15px/22px ${SANS};color:${MUTED};">${total} historias calientes a las ${formatTime(sentAt)} en la línea de temas de la redacción (casa, dinero, cocina, psicología, mascotas, tiempo…), sin política ni deportes. La cifra es el índice viral de 0 a 100.</div>
          ${demoNote}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${groups}</table>
          ${cta}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};
