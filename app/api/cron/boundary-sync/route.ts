import { NextRequest, NextResponse } from "next/server";
import { processBoundarySyncBatch } from "@/lib/indexer/boundarySync";
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

export async function GET(request: NextRequest) {
  try {
    const secret =
      request.headers.get("x-indexer-cron-secret") ??
      new URL(request.url).searchParams.get("secret");

    const supabase = createSupabaseServiceClient();
    const result = await processBoundarySyncBatch({
      supabase,
      requestSecret: secret,
    });

    return jsonResponse({
      ok: result.ok,
      result,
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
