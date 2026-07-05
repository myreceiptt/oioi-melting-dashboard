import { network } from "hardhat";
import { getAddress } from "viem";

import { DEPLOYER_ADDRESS, getDeployConfig } from "./00-config.js";
import { readDeploymentRecord } from "./deployment-state.js";

type PhaseKey = "rotyWhitelist" | "rotyPublic" | "meltingGated" | "amandaGated";

type PhasePlan = {
  key: PhaseKey;
  action: string;
  contractLabel: string;
  address: `0x${string}`;
  functionName:
    "setWhitelistMintEnabled" | "setPublicMintEnabled" | "setGatedMintEnabled";
  current: boolean;
  desired: boolean;
  rollback: string;
  gasEstimate: bigint | null;
  execute: () => Promise<`0x${string}`>;
};

function parseBooleanArg(name: string) {
  const longName = `--${name}`;
  const index = process.argv.indexOf(longName);
  const envName = `MINT_PHASE_${name.toUpperCase().replaceAll("-", "_")}`;
  const envValue = process.env[envName];

  if (envValue === "true") return true;
  if (envValue === "false") return false;
  if (envValue !== undefined && envValue !== "") {
    throw new Error(`${envName} must be true or false.`);
  }

  if (index === -1) return undefined;

  const value = process.argv[index + 1];
  if (value === "true") return true;
  if (value === "false") return false;

  throw new Error(`${longName} must be followed by true or false.`);
}

function getExecuteFlag() {
  if (process.env.MINT_PHASE_EXECUTE === "true") return true;
  if (
    process.env.MINT_PHASE_EXECUTE !== undefined &&
    process.env.MINT_PHASE_EXECUTE !== "" &&
    process.env.MINT_PHASE_EXECUTE !== "false"
  ) {
    throw new Error("MINT_PHASE_EXECUTE must be true or false.");
  }
  return process.argv.includes("--execute");
}

function formatBool(value: boolean) {
  return value ? "true" : "false";
}

async function main() {
  const connection = await network.create();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();

  const networkName = connection.networkName;
  const config = getDeployConfig(networkName);
  const record = readDeploymentRecord(config.deploymentOutputDir);

  if (
    !record?.contracts.roty ||
    !record.contracts.melting ||
    !record.contracts.amanda
  ) {
    throw new Error(`Deployment record for ${networkName} is incomplete.`);
  }

  const [deployer] = await viem.getWalletClients();
  const signer = getAddress(deployer.account.address);
  const expectedSigner = getAddress(DEPLOYER_ADDRESS);

  if (signer !== expectedSigner) {
    throw new Error(`Wrong signer. Got ${signer}, expected ${expectedSigner}.`);
  }

  const roty = await viem.getContractAt(
    "TheRotyMemorial",
    record.contracts.roty,
  );
  const melting = await viem.getContractAt(
    "MeltingMemorial",
    record.contracts.melting,
  );
  const amanda = await viem.getContractAt(
    "AmandaMemorial",
    record.contracts.amanda,
  );

  const rotyOwner = getAddress((await roty.read.owner()) as `0x${string}`);
  const meltingOwner = getAddress(
    (await melting.read.owner()) as `0x${string}`,
  );
  const amandaOwner = getAddress((await amanda.read.owner()) as `0x${string}`);

  for (const [label, owner] of [
    ["ROTY", rotyOwner],
    ["Melting", meltingOwner],
    ["Amanda", amandaOwner],
  ] as const) {
    if (owner !== expectedSigner) {
      throw new Error(`${label} owner mismatch. Got ${owner}.`);
    }
  }

  const metadataStates = {
    roty: (await roty.read.metadataLocked()) as boolean,
    melting: (await melting.read.metadataLocked()) as boolean,
    amanda: (await amanda.read.metadataLocked()) as boolean,
  };

  if (metadataStates.roty || metadataStates.melting || metadataStates.amanda) {
    throw new Error(
      `Metadata lock detected. Refusing mint phase changes. ${JSON.stringify(
        metadataStates,
      )}`,
    );
  }

  const desired = {
    rotyWhitelist: parseBooleanArg("roty-whitelist"),
    rotyPublic: parseBooleanArg("roty-public"),
    meltingGated: parseBooleanArg("melting-gated"),
    amandaGated: parseBooleanArg("amanda-gated"),
  };

  if (Object.values(desired).every((value) => value === undefined)) {
    throw new Error(
      "No desired mint phase provided. Use MINT_PHASE_ROTY_WHITELIST=true|false, MINT_PHASE_ROTY_PUBLIC=true|false, MINT_PHASE_MELTING_GATED=true|false, or MINT_PHASE_AMANDA_GATED=true|false.",
    );
  }

  const rollback = `npm run deploy:restore-mint-phases -- --network ${networkName}`;
  const plans: PhasePlan[] = [];

  if (desired.rotyWhitelist !== undefined) {
    plans.push({
      key: "rotyWhitelist",
      action: "Set ROTY whitelist mint",
      contractLabel: "ROTY",
      address: record.contracts.roty,
      functionName: "setWhitelistMintEnabled",
      current: (await roty.read.whitelistMintEnabled()) as boolean,
      desired: desired.rotyWhitelist,
      rollback,
      gasEstimate: await roty.estimateGas.setWhitelistMintEnabled([
        desired.rotyWhitelist,
      ]),
      execute: () =>
        roty.write.setWhitelistMintEnabled([desired.rotyWhitelist]),
    });
  }

  if (desired.rotyPublic !== undefined) {
    plans.push({
      key: "rotyPublic",
      action: "Set ROTY public mint",
      contractLabel: "ROTY",
      address: record.contracts.roty,
      functionName: "setPublicMintEnabled",
      current: (await roty.read.publicMintEnabled()) as boolean,
      desired: desired.rotyPublic,
      rollback,
      gasEstimate: await roty.estimateGas.setPublicMintEnabled([
        desired.rotyPublic,
      ]),
      execute: () => roty.write.setPublicMintEnabled([desired.rotyPublic]),
    });
  }

  if (desired.meltingGated !== undefined) {
    plans.push({
      key: "meltingGated",
      action: "Set Melting gated mint",
      contractLabel: "Melting",
      address: record.contracts.melting,
      functionName: "setGatedMintEnabled",
      current: (await melting.read.gatedMintEnabled()) as boolean,
      desired: desired.meltingGated,
      rollback,
      gasEstimate: await melting.estimateGas.setGatedMintEnabled([
        desired.meltingGated,
      ]),
      execute: () => melting.write.setGatedMintEnabled([desired.meltingGated]),
    });
  }

  if (desired.amandaGated !== undefined) {
    plans.push({
      key: "amandaGated",
      action: "Set Amanda gated mint",
      contractLabel: "Amanda",
      address: record.contracts.amanda,
      functionName: "setGatedMintEnabled",
      current: (await amanda.read.gatedMintEnabled()) as boolean,
      desired: desired.amandaGated,
      rollback,
      gasEstimate: await amanda.estimateGas.setGatedMintEnabled([
        desired.amandaGated,
      ]),
      execute: () => amanda.write.setGatedMintEnabled([desired.amandaGated]),
    });
  }

  console.log("Mint phase execution table");
  console.table(
    plans.map((plan) => ({
      Action: plan.action,
      Network: networkName,
      Contract: plan.contractLabel,
      Address: plan.address,
      Function: plan.functionName,
      "Expected before": formatBool(plan.current),
      "Expected after": formatBool(plan.desired),
      "Rollback function/command": plan.rollback,
      Signer: signer,
      "Gas estimate": plan.gasEstimate?.toString() ?? "n/a",
    })),
  );

  const changes = plans.filter((plan) => plan.current !== plan.desired);

  if (changes.length === 0) {
    console.log("No mint phase changes needed.");
    return;
  }

  if (!getExecuteFlag()) {
    console.log(
      "Plan-only mode. Re-run with MINT_PHASE_EXECUTE=true after review to submit transactions.",
    );
    return;
  }

  for (const plan of changes) {
    const tx = await plan.execute();
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

    if (receipt.status !== "success") {
      throw new Error(`${plan.action} failed. tx=${tx}`);
    }

    console.log(`${plan.action} mined.`, {
      tx,
      blockNumber: receipt.blockNumber.toString(),
    });
  }

  console.log("Mint phase update complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
