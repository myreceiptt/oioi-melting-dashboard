import { network } from "hardhat";
import { getAddress } from "viem";

import { DEPLOYER_ADDRESS, getDeployConfig } from "./00-config.js";
import { readDeploymentRecord } from "./deployment-state.js";

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
  const deployerAddress = getAddress(deployer.account.address);
  const expectedDeployer = getAddress(DEPLOYER_ADDRESS);

  if (deployerAddress !== expectedDeployer) {
    throw new Error(`Wrong deployer. Got ${deployerAddress}, expected ${expectedDeployer}`);
  }

  const roty = await viem.getContractAt("TheRotyMemorial", record.contracts.roty);
  const melting = await viem.getContractAt("MeltingMemorial", record.contracts.melting);
  const amanda = await viem.getContractAt("AmandaMemorial", record.contracts.amanda);

  async function waitForTx(hash: `0x${string}`, label: string) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      throw new Error(`${label} failed. tx=${hash}`);
    }

    console.log(`${label} mined.`, {
      tx: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  }

  console.log("Restoring mint phases to safe OFF state...", {
    network: networkName,
    roty: record.contracts.roty,
    melting: record.contracts.melting,
    amanda: record.contracts.amanda,
  });

  if ((await roty.read.whitelistMintEnabled()) !== false) {
    const tx = await roty.write.setWhitelistMintEnabled([false]);
    await waitForTx(tx, "ROTY whitelist mint disabled");
  }

  if ((await roty.read.publicMintEnabled()) !== false) {
    const tx = await roty.write.setPublicMintEnabled([false]);
    await waitForTx(tx, "ROTY public mint disabled");
  }

  if ((await melting.read.gatedMintEnabled()) !== false) {
    const tx = await melting.write.setGatedMintEnabled([false]);
    await waitForTx(tx, "Melting gated mint disabled");
  }

  if ((await amanda.read.gatedMintEnabled()) !== false) {
    const tx = await amanda.write.setGatedMintEnabled([false]);
    await waitForTx(tx, "Amanda gated mint disabled");
  }

  console.log("✅ Mint phases restored to safe OFF state.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
