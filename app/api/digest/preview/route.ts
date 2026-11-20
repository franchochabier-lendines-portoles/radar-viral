import { buildDigest } from "@/lib/notify/email";

export const dynamic = "force-dynamic";

export const GET = async () => new Response((await buildDigest()).html, { headers: { "content-type": "text/html; charset=utf-8" } });
