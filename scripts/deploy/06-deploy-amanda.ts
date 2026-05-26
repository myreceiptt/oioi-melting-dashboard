import { network } from "hardhat";
import { getAddress } from "viem";

import {
  DEPLOYER_ADDRESS,
  MINT_TREASURY_ADDRESS,
  ROYALTY_RECEIVER_ADDRESS,
  getDeployConfig,
  getInitialOwnerForNetwork,
  isLocalSimulatedDeployNetwork,
} from "./00-config.js";
import {
  readDeploymentRecord,
  touchDeploymentRecord,
  writeDeploymentRecord,
} from "./deployment-state.js";

async function main() {
  const connection = await network.create();
  const { viem } = connection;

  const networkName = connection.networkName;
  const config = getDeployConfig(networkName);
  const [deployer] = await viem.getWalletClients();

  const deployerAddress = getAddress(deployer.account.address);
  const expectedDeployer = getAddress(DEPLOYER_ADDRESS);
  const initialOwner = getInitialOwnerForNetwork(
    networkName,
    deployer.account.address,
  );

  console.log("Deploying AmandaMemorial...");
  console.log({
    network: networkName,
    chainId: config.chainId,
    label: config.label,
    deployer: deployerAddress,
    expectedDeployer,
    initialOwner,
  });

  const isLocalSimulatedNetwork = isLocalSimulatedDeployNetwork(networkName);

  if (!isLocalSimulatedNetwork && deployerAddress !== expectedDeployer) {
    throw new Error(
      `Unexpected deployer. Got ${deployerAddress}, expected ${expectedDeployer}`,
    );
  }

  if (isLocalSimulatedNetwork) {
    console.warn(
      `Skipping final deployer check on local simulated network: ${networkName}`,
    );
  }

  const record = readDeploymentRecord(config.deploymentOutputDir);

  if (!record?.contracts.roty) {
    throw new Error(`Missing ROTY deployment for ${config.key}.`);
  }

  if (!record.contracts.staking) {
    throw new Error(`Missing staking deployment for ${config.key}.`);
  }

  if (!record.contracts.melting) {
    throw new Error(`Missing Melting deployment for ${config.key}.`);
  }

  if (record.contracts.amanda) {
    throw new Error(
      `Amanda already deployed for ${config.key}: ${record.contracts.amanda}`,
    );
  }

  const amandaConfig = config.collections.amanda;

  const amanda = await viem.deployContract("AmandaMemorial", [
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
    initialOwner,
  ]);

  console.log("AmandaMemorial deployed.");
  console.log({
    address: amanda.address,
    name: amandaConfig.name,
    symbol: amandaConfig.symbol,
    mintPriceWei: amandaConfig.mintPriceWei.toString(),
    staking: record.contracts.staking,
    roty: record.contracts.roty,
    melting: record.contracts.melting,
    initialOwner,
  });

  record.contracts.amanda = amanda.address;

  writeDeploymentRecord(
    config.deploymentOutputDir,
    touchDeploymentRecord(record),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
