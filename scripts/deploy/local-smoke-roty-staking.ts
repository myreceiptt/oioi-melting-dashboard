import { network } from "hardhat";
import { getAddress } from "viem";

import {
  getDeployConfig,
  MINT_TREASURY_ADDRESS,
  ROYALTY_RECEIVER_ADDRESS,
  getInitialOwnerForNetwork,
  isLocalSimulatedDeployNetwork,
} from "./00-config.js";
import {
  createBaseDeploymentRecord,
  touchDeploymentRecord,
  writeDeploymentRecord,
} from "./deployment-state.js";
import { readRotyMerkleRoot } from "./whitelist-root.js";

async function main() {
  const connection = await network.create();
  const { viem } = connection;

  const networkName = connection.networkName;

  if (!isLocalSimulatedDeployNetwork(networkName)) {
    throw new Error(
      `local-smoke-roty-staking is only for local simulated networks. Got: ${networkName}`,
    );
  }

  const config = getDeployConfig(networkName);
  const [deployer] = await viem.getWalletClients();

  const deployerAddress = getAddress(deployer.account.address);
  const initialOwner = getInitialOwnerForNetwork(
    networkName,
    deployer.account.address,
  );

  console.log("Running local ROTY + staking smoke deployment...");
  console.log({
    network: networkName,
    chainId: config.chainId,
    label: config.label,
    deployer: deployerAddress,
    initialOwner,
  });

  const merkleRoot = readRotyMerkleRoot();
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
    initialOwner,
  ]);

  console.log("ROTY deployed.", {
    address: roty.address,
    name: rotyConfig.name,
    symbol: rotyConfig.symbol,
  });

  const staking = await viem.deployContract("OiOiSoftStaking", [
    initialOwner,
  ]);

  console.log("OiOiSoftStaking deployed.", {
    address: staking.address,
  });

  await staking.write.setCollectionApproved([roty.address, true]);

  const approved = await staking.read.approvedCollection([roty.address]);

  if (!approved) {
    throw new Error("ROTY registration failed in local smoke deployment.");
  }

  console.log("ROTY approved in OiOiSoftStaking.", {
    roty: roty.address,
    staking: staking.address,
    approved,
  });

  const record = createBaseDeploymentRecord({
    networkKey: config.key,
    chainId: config.chainId,
    label: config.label,
    oioiToken: config.oioiTokenAddress,
  });

  record.contracts.roty = roty.address;
  record.contracts.staking = staking.address;
  record.registrations.rotyApprovedInStaking = true;

  writeDeploymentRecord(config.deploymentOutputDir, touchDeploymentRecord(record));

  console.log("Local ROTY + staking smoke deployment complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
