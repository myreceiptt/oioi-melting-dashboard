import { network } from "hardhat";
import { getAddress, zeroAddress } from "viem";

import {
  DEPLOYER_ADDRESS,
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

  console.log("Deploying OiOi Reward Distributor...");
  console.log({
    network: networkName,
    chainId: config.chainId,
    label: config.label,
    deployer: deployerAddress,
    expectedDeployer,
    initialOwner,
    rewardToken: config.oioiTokenAddress,
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

  if (config.oioiTokenAddress === zeroAddress) {
    throw new Error(
      `Missing $OiOi token address for ${config.key}. Set BASE_SEPOLIA_OIOI_TOKEN or ETHEREUM_SEPOLIA_OIOI_TOKEN before deploying to testnet.`,
    );
  }

  const record = readDeploymentRecord(config.deploymentOutputDir);

  if (!record) {
    throw new Error(`Missing deployment record for ${config.key}.`);
  }

  if (record.contracts.rewardDistributor) {
    throw new Error(
      `OiOi Reward Distributor already deployed for ${config.key}: ${record.contracts.rewardDistributor}`,
    );
  }

  const rewardDistributor = await viem.deployContract("OiOiRewardDistributor", [
    config.oioiTokenAddress,
    initialOwner,
  ]);

  console.log("OiOiRewardDistributor deployed.");
  console.log({
    address: rewardDistributor.address,
    rewardToken: config.oioiTokenAddress,
    initialOwner,
  });

  record.contracts.rewardDistributor = rewardDistributor.address;
  record.tokens.oioi = config.oioiTokenAddress;

  writeDeploymentRecord(config.deploymentOutputDir, touchDeploymentRecord(record));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
