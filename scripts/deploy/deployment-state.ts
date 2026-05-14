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
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
};

export function getDeploymentFile(outputDir: string) {
  return path.join(outputDir, "deployment.json");
}

export function readDeploymentRecord(outputDir: string): DeploymentRecord | undefined {
  const file = getDeploymentFile(outputDir);

  if (!fs.existsSync(file)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(file, "utf8")) as DeploymentRecord;
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
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function touchDeploymentRecord(record: DeploymentRecord): DeploymentRecord {
  return {
    ...record,
    metadata: {
      ...record.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}
