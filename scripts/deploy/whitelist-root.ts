import fs from "node:fs";
import path from "node:path";
import { zeroHash } from "viem";

export function readRotyMerkleRoot() {
  const rootFile = path.resolve(
    "scripts/whitelist/output/roty-whitelist.root.txt",
  );

  if (!fs.existsSync(rootFile)) {
    console.warn(
      `ROTY Merkle root not found at ${rootFile}. Using zeroHash. Run npm run whitelist:clean && npm run whitelist:merkle before production deployment.`,
    );

    return zeroHash;
  }

  const root = fs.readFileSync(rootFile, "utf8").trim();

  if (!/^0x[a-fA-F0-9]{64}$/.test(root)) {
    throw new Error(`Invalid ROTY Merkle root in ${rootFile}: ${root}`);
  }

  return root as `0x${string}`;
}
