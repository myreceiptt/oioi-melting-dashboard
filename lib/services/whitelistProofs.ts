import type { ChainSet } from "@/lib/chains/chainConfig";

export type RotyWhitelistProofResponse = {
  chain: ChainSet;
  address: `0x${string}`;
  collection: "roty";
  eligible: boolean;
  proof: `0x${string}`[];
  generatedAt: string;
  proofCount: number;
  error?: string;
};

export async function fetchRotyWhitelistProof({
  chainSet,
  address,
}: {
  chainSet: ChainSet;
  address: `0x${string}`;
}) {
  const response = await fetch(`/api/whitelist/roty/${chainSet}/${address}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ROTY whitelist proof: ${response.status}`);
  }

  return (await response.json()) as RotyWhitelistProofResponse;
}
