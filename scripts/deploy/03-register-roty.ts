import { network } from "hardhat";
import { getAddress } from "viem";

import {
  DEPLOYER_ADDRESS,
  getDeployConfig,
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

  console.log("Registering ROTY in OiOiSoftStaking...");
  console.log({
    network: networkName,
    chainId: config.chainId,
    label: config.label,
    deployer: deployerAddress,
    expectedDeployer,
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

  const staking = await viem.getContractAt(
    "OiOiSoftStaking",
    record.contracts.staking,
  );

  const alreadyApproved = await staking.read.approvedCollection([
    record.contracts.roty,
  ]);

  if (alreadyApproved) {
    console.log("ROTY already approved in staking.");
  } else {
    await staking.write.setCollectionApproved([record.contracts.roty, true]);

    console.log("ROTY approved in staking.");
  }

  record.registrations = {
    ...record.registrations,
    rotyApprovedInStaking: true,
  };

  writeDeploymentRecord(
    config.deploymentOutputDir,
    touchDeploymentRecord(record),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
