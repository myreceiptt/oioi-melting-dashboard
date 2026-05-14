import { network } from "hardhat";
import { getAddress } from "viem";

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

  console.log("Deploying OiOiSoftStaking...");
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
    throw new Error(`Deploy ROTY first for ${config.key}.`);
  }

  if (record.contracts.staking) {
    throw new Error(
      `OiOiSoftStaking already deployed for ${config.key}: ${record.contracts.staking}`,
    );
  }

  const staking = await viem.deployContract("OiOiSoftStaking", [initialOwner]);

  console.log("OiOiSoftStaking deployed.");
  console.log({
    address: staking.address,
    initialOwner,
  });

  record.contracts.staking = staking.address;

  writeDeploymentRecord(
    config.deploymentOutputDir,
    touchDeploymentRecord(record),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
