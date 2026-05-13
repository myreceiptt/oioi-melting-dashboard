import fs from "node:fs";
import path from "node:path";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

type CleanEntry = {
  address: `0x${string}`;
  maxClaimable: 1;
  price: "0";
};

type ProofEntry = {
  address: `0x${string}`;
  proof: string[];
};

const OUTPUT_DIR = path.resolve("scripts/whitelist/output");
const CLEAN_INPUT_FILE = path.join(OUTPUT_DIR, "roty-whitelist.clean.json");

const ROOT_OUTPUT_FILE = path.join(OUTPUT_DIR, "roty-whitelist.root.txt");
const TREE_OUTPUT_FILE = path.join(OUTPUT_DIR, "roty-whitelist.tree.json");
const PROOFS_OUTPUT_FILE = path.join(OUTPUT_DIR, "roty-whitelist.proofs.json");

function main() {
  if (!fs.existsSync(CLEAN_INPUT_FILE)) {
    throw new Error(
      `Clean whitelist file not found. Run npm run whitelist:clean first: ${CLEAN_INPUT_FILE}`,
    );
  }

  const cleanEntries = JSON.parse(
    fs.readFileSync(CLEAN_INPUT_FILE, "utf8"),
  ) as CleanEntry[];

  if (cleanEntries.length === 0) {
    throw new Error("Clean whitelist is empty.");
  }

  const values = cleanEntries.map((entry) => [entry.address]);

  const tree = StandardMerkleTree.of(values, ["address"]);

  const proofs: ProofEntry[] = [];

  for (const [index, value] of tree.entries()) {
    const [address] = value as [`0x${string}`];

    proofs.push({
      address,
      proof: tree.getProof(index),
    });
  }

  proofs.sort((a, b) =>
    a.address.toLowerCase().localeCompare(b.address.toLowerCase()),
  );

  fs.writeFileSync(ROOT_OUTPUT_FILE, `${tree.root}\n`);
  fs.writeFileSync(TREE_OUTPUT_FILE, JSON.stringify(tree.dump(), null, 2));
  fs.writeFileSync(PROOFS_OUTPUT_FILE, JSON.stringify(proofs, null, 2));

  console.log("ROTY whitelist Merkle generation complete.");
  console.log({
    root: tree.root,
    totalProofs: proofs.length,
    rootOutput: ROOT_OUTPUT_FILE,
    treeOutput: TREE_OUTPUT_FILE,
    proofsOutput: PROOFS_OUTPUT_FILE,
  });
}

main();
