import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/dashboard";
import { parseFilters } from "@/lib/filters";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return NextResponse.json(getDashboard(parseFilters(params)));
};
