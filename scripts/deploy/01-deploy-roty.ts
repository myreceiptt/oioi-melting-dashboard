import { network } from "hardhat";
import { getAddress } from "viem";

import {
  getDeployConfig,
  MINT_TREASURY_ADDRESS,
  ROYALTY_RECEIVER_ADDRESS,
  DEPLOYER_ADDRESS,
} from "./00-config.js";
import {
  createBaseDeploymentRecord,
  readDeploymentRecord,
  touchDeploymentRecord,
  writeDeploymentRecord,
} from "./deployment-state.js";
import { readRotyMerkleRoot } from "./whitelist-root.js";

async function main() {
  const connection = await network.create();
  const { viem } = connection;

  const networkName = connection.networkName;
  const config = getDeployConfig(networkName);
  const [deployer] = await viem.getWalletClients();

  const deployerAddress = getAddress(deployer.account.address);
  const expectedDeployer = getAddress(DEPLOYER_ADDRESS);

  console.log("Deploying ROTY...");
  console.log({
    network: networkName,
    chainId: config.chainId,
    label: config.label,
    deployer: deployerAddress,
    expectedDeployer,
  });

  if (deployerAddress !== expectedDeployer) {
    throw new Error(
      `Unexpected deployer. Got ${deployerAddress}, expected ${expectedDeployer}`,
    );
  }

  const merkleRoot = readRotyMerkleRoot();

  const existingRecord = readDeploymentRecord(config.deploymentOutputDir);

  if (existingRecord?.contracts.roty) {
    throw new Error(
      `ROTY already deployed for ${config.key}: ${existingRecord.contracts.roty}`,
    );
  }

  const rotyConfig = config.collections.roty;

  const roty = await viem.deployContract("TheRotyMemorial", [
    rotyConfig.name,
    rotyConfig.symbol,
    rotyConfig.mintPriceWei,
    merkleRoot,
    MINT_TREASURY_ADDRESS,
    ROYALTY_RECEIVER_ADDRESS,
    rotyConfig.unrevealedURI,
    rotyConfig.revealedBaseURI,
    DEPLOYER_ADDRESS,
  ]);

  console.log("ROTY deployed.");
  console.log({
    address: roty.address,
    name: rotyConfig.name,
    symbol: rotyConfig.symbol,
    mintPriceWei: rotyConfig.mintPriceWei.toString(),
    merkleRoot,
  });

  const record =
    existingRecord ??
    createBaseDeploymentRecord({
      networkKey: config.key,
      chainId: config.chainId,
      label: config.label,
      oioiToken: config.oioiTokenAddress,
    });

  record.contracts.roty = roty.address;
  writeDeploymentRecord(
    config.deploymentOutputDir,
    touchDeploymentRecord(record),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
