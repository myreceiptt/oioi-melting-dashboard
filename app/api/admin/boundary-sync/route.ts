import { NextRequest, NextResponse } from "next/server";
import {
  createBoundarySyncJob,
  fetchBoundarySyncJob,
} from "@/lib/indexer/boundarySync";
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

function getRequestActor(request: NextRequest) {
  return (
    request.headers.get("x-oioi-admin") ??
    request.headers.get("x-forwarded-user") ??
    null
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const supabase = createSupabaseServiceClient();
    const data = await fetchBoundarySyncJob({ supabase, jobId });

    return jsonResponse({
      ok: true,
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
            : "Unexpected boundary sync status API error.",
      },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const supabase = createSupabaseServiceClient();
    const data = await createBoundarySyncJob({
      supabase,
      payload,
      requestedBy: getRequestActor(request),
    });

    return jsonResponse({
      ok: true,
      ...data,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected boundary sync submit API error.";

    return jsonResponse(
      {
        ok: false,
        error: message,
      },
      message.includes("already active") ? 409 : 400,
    );
  }
}
