import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getDashboardWalletNfts } from "@/lib/dashboard/walletNfts";
import type { ChainSet } from "@/lib/chains/chainConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isChainSet(value: string | null): value is ChainSet {
  return value === "base" || value === "ethereum";
}

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
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");
    const account = searchParams.get("account");
    const forceRefresh = searchParams.get("refresh") === "1";

    if (!isChainSet(chain)) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid chain. Use chain=base or chain=ethereum.",
        },
        400,
      );
    }

    if (!account) {
      return jsonResponse(
        {
          ok: false,
          error: "Missing account query parameter.",
        },
        400,
      );
    }

    const supabase = createSupabaseServiceClient();
    const data = await getDashboardWalletNfts({
      supabase,
      chainSet: chain,
      account,
      forceRefresh,
    });

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
            : "Unexpected dashboard wallet NFT API error.",
      },
      500,
    );
  }
}
