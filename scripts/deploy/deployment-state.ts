import fs from "node:fs";
import path from "node:path";
import type { Address } from "viem";

export type DeploymentRecord = {
  network: {
    key: string;
    chainId: number;
    label: string;
  };
  contracts: {
    roty?: Address;
    staking?: Address;
    melting?: Address;
    amanda?: Address;
    rewardDistributor?: Address;
  };
  tokens: {
    oioi: Address;
  };
  registrations: {
    rotyApprovedInStaking?: boolean;
    meltingApprovedInStaking?: boolean;
    amandaApprovedInStaking?: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
};

export function getDeploymentFile(outputDir: string) {
  return path.join(outputDir, "deployment.json");
}

export function readDeploymentRecord(
  outputDir: string,
): DeploymentRecord | undefined {
  const file = getDeploymentFile(outputDir);

  if (!fs.existsSync(file)) {
    return undefined;
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as DeploymentRecord;

  return {
    ...parsed,
    registrations: parsed.registrations ?? {},
  };
}

export function writeDeploymentRecord(
  outputDir: string,
  record: DeploymentRecord,
) {
  fs.mkdirSync(outputDir, { recursive: true });

  const file = getDeploymentFile(outputDir);

  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);

  console.log(`Deployment record written: ${file}`);
}

export function createBaseDeploymentRecord(args: {
  networkKey: string;
  chainId: number;
  label: string;
  oioiToken: Address;
}): DeploymentRecord {
  const now = new Date().toISOString();

  return {
    network: {
      key: args.networkKey,
      chainId: args.chainId,
      label: args.label,
    },
    contracts: {},
    tokens: {
      oioi: args.oioiToken,
    },
    registrations: {},
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function touchDeploymentRecord(
  record: DeploymentRecord,
): DeploymentRecord {
  return {
    ...record,
    registrations: record.registrations ?? {},
    metadata: {
      ...record.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}
