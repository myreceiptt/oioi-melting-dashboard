import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";

const allowedChains = ["base", "ethereum"] as const;

type ChainSet = (typeof allowedChains)[number];

function isChainSet(value: string): value is ChainSet {
  return allowedChains.includes(value as ChainSet);
}

type ProofFile = {
  generatedAt: string;
  collection: "roty";
  proofCount: number;
  proofs: Record<string, string[]>;
};

function readProofFile(): ProofFile {
  const file = path.join(process.cwd(), "public/whitelist/roty-proofs.json");

  if (!fs.existsSync(file)) {
    return {
      generatedAt: new Date(0).toISOString(),
      collection: "roty",
      proofCount: 0,
      proofs: {},
    };
  }

  return JSON.parse(fs.readFileSync(file, "utf8")) as ProofFile;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ chain: string; address: string }> },
) {
  const { chain, address } = await context.params;

  if (!isChainSet(chain)) {
    return NextResponse.json(
      {
        eligible: false,
        error: "Invalid chain.",
      },
      { status: 400 },
    );
  }

  if (!isAddress(address)) {
    return NextResponse.json(
      {
        eligible: false,
        error: "Invalid address.",
      },
      { status: 400 },
    );
  }

  const normalizedAddress = getAddress(address).toLowerCase();
  const proofFile = readProofFile();
  const proof = proofFile.proofs[normalizedAddress];

  return NextResponse.json({
    chain,
    address: getAddress(address),
    collection: "roty",
    eligible: Boolean(proof),
    proof: proof ?? [],
    generatedAt: proofFile.generatedAt,
    proofCount: proofFile.proofCount,
  });
}
