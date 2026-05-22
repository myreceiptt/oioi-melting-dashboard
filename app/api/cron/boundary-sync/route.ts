import { NextRequest, NextResponse } from "next/server";
import { fetchBoundarySyncJob } from "@/lib/indexer/boundarySync";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function requireCronSecret(requestSecret: string | null) {
  const expected = process.env.INDEXER_CRON_SECRET;
  if (!expected) return;
  if (requestSecret !== expected) {
    throw new Error("Invalid INDEXER_CRON_SECRET.");
  }
}

export async function GET(request: NextRequest) {
  try {
    const secret =
      request.headers.get("x-indexer-cron-secret") ??
      new URL(request.url).searchParams.get("secret");
    requireCronSecret(secret);

    const supabase = createSupabaseServiceClient();
    const data = await fetchBoundarySyncJob({ supabase });

    return jsonResponse({
      ok: true,
      worker: "cli",
      message:
        "Boundary sync jobs are processed by npm run indexer:boundary-worker.",
      ...data,
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected boundary sync worker API error.",
      },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
