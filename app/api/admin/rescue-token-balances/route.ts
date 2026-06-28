import { NextRequest, NextResponse } from "next/server";
import { formatUnits, getAddress, isAddress, type Address } from "viem";
import type { ChainSet } from "@/lib/chains/chainConfig";
import { getContractAddresses } from "@/lib/contracts/addresses";
import { getAppEnv } from "@/lib/utils/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RescueCollection = "roty" | "melting" | "amanda";

type AlchemyTokenBalance = {
  contractAddress: string;
  tokenBalance: string | null;
  error?: string | null;
};

type AlchemyTokenBalancesResult = {
  address: string;
  tokenBalances: AlchemyTokenBalance[];
};

type AlchemyTokenMetadataResult = {
  name?: string | null;
  symbol?: string | null;
  decimals?: number | string | null;
  logo?: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isChainSet(value: string | null): value is ChainSet {
  return value === "base" || value === "ethereum";
}

function isRescueCollection(value: string | null): value is RescueCollection {
  return value === "roty" || value === "melting" || value === "amanda";
}

function getAlchemyRpcUrl(chainSet: ChainSet) {
  const appEnv = getAppEnv();

  if (appEnv === "mainnet") {
    return chainSet === "base"
      ? process.env.ALCHEMY_BASE_MAINNET_RPC_URL || process.env.BASE_RPC_URL
      : process.env.ALCHEMY_ETHEREUM_MAINNET_RPC_URL ||
          process.env.ETHEREUM_RPC_URL;
  }

  return chainSet === "base"
    ? process.env.ALCHEMY_BASE_SEPOLIA_RPC_URL ||
        process.env.BASE_SEPOLIA_RPC_URL
    : process.env.ALCHEMY_ETHEREUM_SEPOLIA_RPC_URL ||
        process.env.ETHEREUM_SEPOLIA_RPC_URL;
}

async function alchemyRequest<T>({
  rpcUrl,
  method,
  params,
}: {
  rpcUrl: string;
  method: string;
  params: unknown[];
}) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
    cache: "no-store",
  });

  const json = (await response.json()) as {
    result?: T;
    error?: { message?: string };
  };

  if (!response.ok || json.error || json.result === undefined) {
    throw new Error(
      json.error?.message ?? `Alchemy ${method} request failed.`,
    );
  }

  return json.result;
}

function parseTokenBalance(value: string | null) {
  if (!value) {
    return 0n;
  }

  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function normalizeDecimals(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  ) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());

    if (Number.isSafeInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 18;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get("chain");
    const collection = searchParams.get("collection");

    if (!isChainSet(chain)) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid chain. Use chain=base or chain=ethereum.",
        },
        400,
      );
    }

    if (!isRescueCollection(collection)) {
      return jsonResponse(
        {
          ok: false,
          error: "Invalid collection. Use roty, melting, or amanda.",
        },
        400,
      );
    }

    const rpcUrl = getAlchemyRpcUrl(chain);

    if (!rpcUrl) {
      return jsonResponse(
        {
          ok: false,
          error: `Missing Alchemy RPC URL for ${chain}.`,
        },
        500,
      );
    }

    const addresses = getContractAddresses(chain);
    const contractAddress = addresses[collection];
    const balances = await alchemyRequest<AlchemyTokenBalancesResult>({
      rpcUrl,
      method: "alchemy_getTokenBalances",
      params: [contractAddress, "erc20"],
    });
    const nonZeroBalances = balances.tokenBalances
      .map((token) => ({
        ...token,
        balanceValue: parseTokenBalance(token.tokenBalance),
      }))
      .filter(
        (token) =>
          token.balanceValue > 0n &&
          !token.error &&
          isAddress(token.contractAddress),
      );

    const tokens = await Promise.all(
      nonZeroBalances.map(async (token) => {
        const tokenAddress = getAddress(token.contractAddress) as Address;
        let metadata: AlchemyTokenMetadataResult = {};

        try {
          metadata = await alchemyRequest<AlchemyTokenMetadataResult>({
            rpcUrl,
            method: "alchemy_getTokenMetadata",
            params: [tokenAddress],
          });
        } catch {
          metadata = {};
        }

        const decimals = normalizeDecimals(metadata.decimals);
        const symbol =
          typeof metadata.symbol === "string" && metadata.symbol.trim()
            ? metadata.symbol.trim()
            : "token";
        const name =
          typeof metadata.name === "string" && metadata.name.trim()
            ? metadata.name.trim()
            : symbol;

        return {
          address: tokenAddress,
          name,
          symbol,
          decimals,
          balance_wei: token.balanceValue.toString(),
          balance_formatted: formatUnits(token.balanceValue, decimals),
        };
      }),
    );

    return jsonResponse({
      ok: true,
      chain,
      collection,
      contractAddress,
      tokens,
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected rescue token balance API error.",
      },
      500,
    );
  }
}
