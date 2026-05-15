import fs from "node:fs";
import path from "node:path";

import {
  DEPLOYER_ADDRESS,
  MINT_TREASURY_ADDRESS,
  ROYALTY_RECEIVER_ADDRESS,
  getDeployConfig,
} from "../deploy/00-config.js";
import { readDeploymentRecord } from "../deploy/deployment-state.js";
import { readRotyMerkleRoot } from "../deploy/whitelist-root.js";

type ConstructorArgsMap = {
  TheRotyMemorial: unknown[];
  OiOiSoftStaking: unknown[];
  MeltingMemorial: unknown[];
  AmandaMemorial: unknown[];
  OiOiRewardDistributor: unknown[];
};

function stringifyBigInt(value: unknown) {
  return JSON.stringify(
    value,
    (_, item) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );
}

function toTsExport(args: unknown[]) {
  return `const constructorArgs = ${stringifyBigInt(args)} as const;

export default constructorArgs;
`;
}

function getNetworkName() {
  const argIndex = process.argv.findIndex((arg) => arg === "--network-name");

  if (argIndex >= 0) {
    const value = process.argv[argIndex + 1];

    if (!value) {
      throw new Error("Missing value after --network-name");
    }

    return value;
  }

  const positional = process.argv[2];

  if (positional) {
    return positional;
  }

  throw new Error(
    "Missing network name. Usage: tsx scripts/verify/export-constructor-args.ts baseSepolia",
  );
}

function main() {
  const networkName = getNetworkName();
  const config = getDeployConfig(networkName);
  const record = readDeploymentRecord(config.deploymentOutputDir);

  if (!record) {
    throw new Error(`Missing deployment record: ${config.deploymentOutputDir}`);
  }

  if (!record.contracts.roty) {
    throw new Error(`Missing ROTY address in deployment record for ${networkName}`);
  }

  if (!record.contracts.staking) {
    throw new Error(`Missing staking address in deployment record for ${networkName}`);
  }

  if (!record.contracts.melting) {
    throw new Error(`Missing Melting address in deployment record for ${networkName}`);
  }

  if (!record.contracts.amanda) {
    throw new Error(`Missing Amanda address in deployment record for ${networkName}`);
  }

  if (!record.contracts.rewardDistributor) {
    throw new Error(
      `Missing reward distributor address in deployment record for ${networkName}`,
    );
  }

  const rotyConfig = config.collections.roty;
  const meltingConfig = config.collections.melting;
  const amandaConfig = config.collections.amanda;

  const rotyMerkleRoot = readRotyMerkleRoot();

  const args: ConstructorArgsMap = {
    TheRotyMemorial: [
      rotyConfig.name,
      rotyConfig.symbol,
      rotyConfig.mintPriceWei,
      rotyMerkleRoot,
      MINT_TREASURY_ADDRESS,
      ROYALTY_RECEIVER_ADDRESS,
      rotyConfig.unrevealedURI,
      rotyConfig.revealedBaseURI,
      DEPLOYER_ADDRESS,
    ],

    OiOiSoftStaking: [DEPLOYER_ADDRESS],

    MeltingMemorial: [
      meltingConfig.name,
      meltingConfig.symbol,
      meltingConfig.mintPriceWei,
      record.contracts.staking,
      record.contracts.roty,
      MINT_TREASURY_ADDRESS,
      ROYALTY_RECEIVER_ADDRESS,
      meltingConfig.unrevealedURI,
      meltingConfig.revealedBaseURI,
      DEPLOYER_ADDRESS,
    ],

    AmandaMemorial: [
      amandaConfig.name,
      amandaConfig.symbol,
      amandaConfig.mintPriceWei,
      record.contracts.staking,
      record.contracts.roty,
      record.contracts.melting,
      MINT_TREASURY_ADDRESS,
      ROYALTY_RECEIVER_ADDRESS,
      amandaConfig.unrevealedURI,
      amandaConfig.revealedBaseURI,
      DEPLOYER_ADDRESS,
    ],

    OiOiRewardDistributor: [record.tokens.oioi, DEPLOYER_ADDRESS],
  };

  const outputDir = path.join(config.deploymentOutputDir, "constructor-args");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [contractName, constructorArgs] of Object.entries(args)) {
    const outputFile = path.join(outputDir, `${contractName}.ts`);

    fs.writeFileSync(outputFile, toTsExport(constructorArgs));

    console.log(`Wrote constructor args: ${outputFile}`);
  }

  const summaryFile = path.join(outputDir, "summary.json");

  fs.writeFileSync(
    summaryFile,
    `${stringifyBigInt({
      network: config.key,
      chainId: config.chainId,
      contracts: record.contracts,
      tokens: record.tokens,
      constructorArgs: args,
    })}\n`,
  );

  console.log("Constructor args export complete.");
  console.log({
    network: config.key,
    outputDir,
    summaryFile,
  });
}

main();
