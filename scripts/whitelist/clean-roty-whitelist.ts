import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getAddress, isAddress } from "viem";

type RawRow = {
  address?: string;
  maxClaimable?: string;
  price?: string;
};

type CleanEntry = {
  address: `0x${string}`;
  maxClaimable: 1;
  price: "0";
};

type RejectedEntry = {
  rowNumber: number;
  reason: string;
  row: RawRow;
};

const INPUT_FILE = path.resolve(
  "scripts/whitelist/whitelist-oioi-snapshot-overrides.csv",
);

const OUTPUT_DIR = path.resolve("scripts/whitelist/output");
const CLEAN_OUTPUT_FILE = path.join(OUTPUT_DIR, "roty-whitelist.clean.json");
const REJECTED_OUTPUT_FILE = path.join(
  OUTPUT_DIR,
  "roty-whitelist.rejected.json",
);

function normalizePrice(value: string | undefined): string {
  const raw = String(value ?? "").trim();

  if (raw === "" || raw === "0" || raw === "0.0" || raw === "0.00") {
    return "0";
  }

  return raw;
}

function normalizeMaxClaimable(value: string | undefined): string {
  return String(value ?? "").trim();
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`Whitelist CSV not found: ${INPUT_FILE}`);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const csv = fs.readFileSync(INPUT_FILE, "utf8");

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as RawRow[];

  const unique = new Map<string, CleanEntry>();
  const rejected: RejectedEntry[] = [];

  let duplicateCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const rawAddress = String(row.address ?? "").trim();
    const rawMaxClaimable = normalizeMaxClaimable(row.maxClaimable);
    const rawPrice = normalizePrice(row.price);

    if (!isAddress(rawAddress)) {
      rejected.push({
        rowNumber,
        reason: "INVALID_ADDRESS",
        row,
      });
      return;
    }

    if (rawMaxClaimable !== "1") {
      rejected.push({
        rowNumber,
        reason: "INVALID_MAX_CLAIMABLE",
        row,
      });
      return;
    }

    if (rawPrice !== "0") {
      rejected.push({
        rowNumber,
        reason: "INVALID_PRICE",
        row,
      });
      return;
    }

    const checksumAddress = getAddress(rawAddress) as `0x${string}`;
    const key = checksumAddress.toLowerCase();

    if (unique.has(key)) {
      duplicateCount += 1;
      return;
    }

    unique.set(key, {
      address: checksumAddress,
      maxClaimable: 1,
      price: "0",
    });
  });

  const cleanEntries = [...unique.values()].sort((a, b) =>
    a.address.toLowerCase().localeCompare(b.address.toLowerCase()),
  );

  fs.writeFileSync(CLEAN_OUTPUT_FILE, JSON.stringify(cleanEntries, null, 2));
  fs.writeFileSync(REJECTED_OUTPUT_FILE, JSON.stringify(rejected, null, 2));

  console.log("ROTY whitelist cleaning complete.");
  console.log({
    inputRows: rows.length,
    cleanUniqueAddresses: cleanEntries.length,
    rejectedRows: rejected.length,
    duplicateRows: duplicateCount,
    cleanOutput: CLEAN_OUTPUT_FILE,
    rejectedOutput: REJECTED_OUTPUT_FILE,
  });
}

main();
