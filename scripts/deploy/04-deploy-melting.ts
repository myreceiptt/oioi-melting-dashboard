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

  console.log("Deploying MeltingMemorial...");
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

  if (record.contracts.melting) {
    throw new Error(
      `Melting already deployed for ${config.key}: ${record.contracts.melting}`,
    );
  }

  const meltingConfig = config.collections.melting;

  const melting = await viem.deployContract("MeltingMemorial", [
    meltingConfig.name,
    meltingConfig.symbol,
    meltingConfig.mintPriceWei,
    record.contracts.staking,
    record.contracts.roty,
    MINT_TREASURY_ADDRESS,
    ROYALTY_RECEIVER_ADDRESS,
    meltingConfig.unrevealedURI,
    meltingConfig.revealedBaseURI,
    initialOwner,
  ]);

  console.log("MeltingMemorial deployed.");
  console.log({
    address: melting.address,
    name: meltingConfig.name,
    symbol: meltingConfig.symbol,
    mintPriceWei: meltingConfig.mintPriceWei.toString(),
    staking: record.contracts.staking,
    roty: record.contracts.roty,
    initialOwner,
  });

  record.contracts.melting = melting.address;

  writeDeploymentRecord(config.deploymentOutputDir, touchDeploymentRecord(record));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
