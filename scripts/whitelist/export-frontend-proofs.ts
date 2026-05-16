import fs from "node:fs";
import path from "node:path";
import { getAddress, isAddress } from "viem";

type ProofRecord = {
  address: string;
  proof: string[];
};

type FrontendProofFile = {
  generatedAt: string;
  collection: "roty";
  proofCount: number;
  proofs: Record<string, string[]>;
};

const outputDir = path.join(process.cwd(), "scripts/whitelist/output");
const publicDir = path.join(process.cwd(), "public/whitelist");
const targetFile = path.join(publicDir, "roty-proofs.json");

function findProofSourceFile() {
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Missing whitelist output directory: ${outputDir}`);
  }

  const files = fs
    .readdirSync(outputDir)
    .filter((file) => file.endsWith(".json"))
    .filter((file) => file.toLowerCase().includes("proof"));

  if (files.length === 0) {
    throw new Error(
      `No proof JSON found in ${outputDir}. Run npm run whitelist:clean && npm run whitelist:merkle first.`,
    );
  }

  files.sort();

  return path.join(outputDir, files[0]);
}

function normalizeProofs(input: unknown): ProofRecord[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const address = record.address ?? record.wallet ?? record.account;
        const proof = record.proof;

        if (typeof address !== "string" || !Array.isArray(proof)) {
          return null;
        }

        return {
          address,
          proof: proof.map(String),
        };
      })
      .filter(Boolean) as ProofRecord[];
  }

  if (!input || typeof input !== "object") {
    throw new Error("Unsupported proof JSON format.");
  }

  const objectInput = input as Record<string, unknown>;

  if (objectInput.proofs && typeof objectInput.proofs === "object") {
    return normalizeProofs(objectInput.proofs);
  }

  const records: ProofRecord[] = [];

  for (const [key, value] of Object.entries(objectInput)) {
    if (Array.isArray(value)) {
      records.push({
        address: key,
        proof: value.map(String),
      });
      continue;
    }

    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const address = nested.address ?? nested.wallet ?? nested.account ?? key;
      const proof = nested.proof;

      if (typeof address === "string" && Array.isArray(proof)) {
        records.push({
          address,
          proof: proof.map(String),
        });
      }
    }
  }

  return records;
}

function main() {
  const sourceFile = findProofSourceFile();
  const raw = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
  const records = normalizeProofs(raw);

  const proofs: Record<string, string[]> = {};

  for (const record of records) {
    if (!isAddress(record.address)) {
      continue;
    }

    const checksum = getAddress(record.address);
    proofs[checksum.toLowerCase()] = record.proof;
  }

  fs.mkdirSync(publicDir, { recursive: true });

  const frontendFile: FrontendProofFile = {
    generatedAt: new Date().toISOString(),
    collection: "roty",
    proofCount: Object.keys(proofs).length,
    proofs,
  };

  fs.writeFileSync(targetFile, `${JSON.stringify(frontendFile, null, 2)}\n`);

  console.log("Frontend whitelist proof export complete.");
  console.log({
    sourceFile,
    targetFile,
    proofCount: frontendFile.proofCount,
  });
}

main();
