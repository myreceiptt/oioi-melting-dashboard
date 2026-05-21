import "dotenv/config";
import { createSupabaseServiceClient } from "@/lib/supabase/server.js";

type ChainRow = {
  chain_key: string;
  chain_id: number;
  label: string;
  is_testnet: boolean;
};

async function main() {
  console.log("Checking Supabase connection...");

  const supabase = createSupabaseServiceClient();

  const { data: chains, error: chainsError } = await supabase
    .from("chains")
    .select("chain_key, chain_id, label, is_testnet")
    .order("chain_id", { ascending: true });

  if (chainsError) {
    throw new Error(`Failed to read chains table: ${chainsError.message}`);
  }

  const { count: contractCount, error: contractsError } = await supabase
    .from("contracts")
    .select("id", { count: "exact", head: true });

  if (contractsError) {
    throw new Error(
      `Failed to read contracts table: ${contractsError.message}`,
    );
  }

  const typedChains = (chains ?? []) as ChainRow[];

  const expectedChains = new Set(["baseSepolia", "ethereumSepolia"]);
  const foundChains = new Set(typedChains.map((chain) => chain.chain_key));
  const missingChains = [...expectedChains].filter(
    (chainKey) => !foundChains.has(chainKey),
  );

  if (missingChains.length > 0) {
    throw new Error(`Missing expected chains: ${missingChains.join(", ")}`);
  }

  console.log("Supabase connection OK.");
  console.log({
    chains: typedChains,
    contractCount,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
