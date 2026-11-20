import { buildDigest } from "@/lib/notify/email";

export const dynamic = "force-dynamic";

export const GET = () => new Response(buildDigest().html, { headers: { "content-type": "text/html; charset=utf-8" } });
