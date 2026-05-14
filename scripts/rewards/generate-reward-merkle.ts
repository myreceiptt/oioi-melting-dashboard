import fs from "node:fs";
import path from "node:path";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { getAddress, isAddress } from "viem";

import type {
  RewardAllocation,
  RewardMerkleInput,
  RewardMerkleOutput,
  RewardProofEntry,
} from "./types.js";

const DEFAULT_INPUT_FILE = path.resolve(
  "scripts/rewards/input/reward-round.input.json",
);

const OUTPUT_DIR = path.resolve("scripts/rewards/output");

function stringifyBigInt(value: unknown) {
  return JSON.stringify(
    value,
    (_, item) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );
}

function getInputFile() {
  const argIndex = process.argv.findIndex((arg) => arg === "--input");

  if (argIndex >= 0) {
    const value = process.argv[argIndex + 1];

    if (!value) {
      throw new Error("Missing value after --input");
    }

    return path.resolve(value);
  }

  return DEFAULT_INPUT_FILE;
}

function normalizeAllocation(
  allocation: RewardAllocation,
  index: number,
): RewardAllocation {
  if (!isAddress(allocation.wallet)) {
    throw new Error(`Invalid wallet address at allocation index ${index}`);
  }

  const amount = BigInt(allocation.amountWei);

  if (amount <= 0n) {
    throw new Error(`Invalid amountWei at allocation index ${index}`);
  }

  return {
    ...allocation,
    wallet: getAddress(allocation.wallet) as `0x${string}`,
    amountWei: amount.toString(),
  };
}

function main() {
  const inputFile = getInputFile();

  if (!fs.existsSync(inputFile)) {
    throw new Error(`Reward Merkle input not found: ${inputFile}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const input = JSON.parse(
    fs.readFileSync(inputFile, "utf8"),
  ) as RewardMerkleInput;

  if (!input.chain) {
    throw new Error("Missing chain");
  }

  if (!input.roundId || input.roundId <= 0) {
    throw new Error("Invalid roundId");
  }

  const rewardAmountWei = BigInt(input.rewardAmountWei);

  if (rewardAmountWei <= 0n) {
    throw new Error("Invalid rewardAmountWei");
  }

  if (!Array.isArray(input.allocations) || input.allocations.length === 0) {
    throw new Error("allocations must be a non-empty array");
  }

  const unique = new Map<string, RewardAllocation>();

  input.allocations.forEach((allocation, index) => {
    const normalized = normalizeAllocation(allocation, index);
    const key = normalized.wallet.toLowerCase();

    if (unique.has(key)) {
      throw new Error(`Duplicate wallet in allocations: ${normalized.wallet}`);
    }

    unique.set(key, normalized);
  });

  const allocations = [...unique.values()].sort((a, b) =>
    a.wallet.toLowerCase().localeCompare(b.wallet.toLowerCase()),
  );

  const totalAllocatedWei = allocations.reduce(
    (sum, allocation) => sum + BigInt(allocation.amountWei),
    0n,
  );

  if (totalAllocatedWei !== rewardAmountWei) {
    throw new Error(
      `Allocation sum mismatch. totalAllocatedWei=${totalAllocatedWei.toString()} rewardAmountWei=${rewardAmountWei.toString()}`,
    );
  }

  const values = allocations.map((allocation) => [
    BigInt(input.roundId),
    allocation.wallet,
    BigInt(allocation.amountWei),
  ]);

  const tree = StandardMerkleTree.of(values, ["uint256", "address", "uint256"]);

  const proofs: RewardProofEntry[] = [];

  for (const [index, value] of tree.entries()) {
    const [, wallet, amountWei] = value as [bigint, `0x${string}`, bigint];

    proofs.push({
      wallet,
      amountWei: amountWei.toString(),
      proof: tree.getProof(index) as `0x${string}`[],
    });
  }

  proofs.sort((a, b) =>
    a.wallet.toLowerCase().localeCompare(b.wallet.toLowerCase()),
  );

  const output: RewardMerkleOutput = {
    chain: input.chain,
    roundId: input.roundId,
    rewardAmountWei: rewardAmountWei.toString(),
    totalAllocatedWei: totalAllocatedWei.toString(),
    merkleRoot: tree.root as `0x${string}`,
    proofs,
  };

  const prefix = `${input.chain}-round-${String(input.roundId).padStart(3, "0")}`;

  const rootOutputFile = path.join(OUTPUT_DIR, `${prefix}.root.txt`);
  const treeOutputFile = path.join(OUTPUT_DIR, `${prefix}.tree.json`);
  const proofsOutputFile = path.join(OUTPUT_DIR, `${prefix}.proofs.json`);
  const outputFile = path.join(OUTPUT_DIR, `${prefix}.merkle.json`);

  fs.writeFileSync(rootOutputFile, `${tree.root}\n`);
  fs.writeFileSync(treeOutputFile, stringifyBigInt(tree.dump()));
  fs.writeFileSync(proofsOutputFile, stringifyBigInt(proofs));
  fs.writeFileSync(outputFile, stringifyBigInt(output));

  console.log("Reward Merkle generation complete.");
  console.log({
    chain: input.chain,
    roundId: input.roundId,
    rewardAmountWei: rewardAmountWei.toString(),
    totalAllocatedWei: totalAllocatedWei.toString(),
    allocationCount: allocations.length,
    merkleRoot: tree.root,
    rootOutputFile,
    outputFile,
    proofsOutputFile,
    treeOutputFile,
  });
}

main();
