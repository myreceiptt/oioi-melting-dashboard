import { network } from "hardhat";
import { getAddress, parseEther } from "viem";

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

const MOCK_OIOI_NAME = "OiOi Token";
const MOCK_OIOI_SYMBOL = "OiOi";
const MOCK_OIOI_SUPPLY = parseEther("47474747");

async function main() {
  const connection = await network.create();
  const { viem } = connection;

  const networkName = connection.networkName;

  if (!isLocalSimulatedDeployNetwork(networkName)) {
    throw new Error(
      `local-smoke-full-deploy is only for local simulated networks. Got: ${networkName}`,
    );
  }

  const config = getDeployConfig(networkName);
  const [deployer] = await viem.getWalletClients();

  const deployerAddress = getAddress(deployer.account.address);
  const initialOwner = getInitialOwnerForNetwork(
    networkName,
    deployer.account.address,
  );

  console.log("Running full local smoke deployment...");
  console.log({
    network: networkName,
    chainId: config.chainId,
    label: config.label,
    deployer: deployerAddress,
    initialOwner,
  });

  const merkleRoot = readRotyMerkleRoot();

  // 1. Deploy ROTY.
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

  // 2. Deploy staking.
  const staking = await viem.deployContract("OiOiSoftStaking", [initialOwner]);

  console.log("OiOiSoftStaking deployed.", {
    address: staking.address,
  });

  // 3. Register ROTY.
  await staking.write.setCollectionApproved([roty.address, true]);

  const rotyApproved = await staking.read.approvedCollection([roty.address]);

  if (!rotyApproved) {
    throw new Error("ROTY registration failed.");
  }

  console.log("ROTY approved in staking.", {
    roty: roty.address,
    staking: staking.address,
    approved: rotyApproved,
  });

  // 4. Deploy Melting.
  const meltingConfig = config.collections.melting;

  const melting = await viem.deployContract("MeltingMemorial", [
    meltingConfig.name,
    meltingConfig.symbol,
    meltingConfig.mintPriceWei,
    staking.address,
    roty.address,
    MINT_TREASURY_ADDRESS,
    ROYALTY_RECEIVER_ADDRESS,
    meltingConfig.unrevealedURI,
    meltingConfig.revealedBaseURI,
    initialOwner,
  ]);

  console.log("Melting deployed.", {
    address: melting.address,
    name: meltingConfig.name,
    symbol: meltingConfig.symbol,
  });

  // 5. Register Melting.
  await staking.write.setCollectionApproved([melting.address, true]);

  const meltingApproved = await staking.read.approvedCollection([
    melting.address,
  ]);

  if (!meltingApproved) {
    throw new Error("Melting registration failed.");
  }

  console.log("Melting approved in staking.", {
    melting: melting.address,
    staking: staking.address,
    approved: meltingApproved,
  });

  // 6. Deploy Amanda.
  const amandaConfig = config.collections.amanda;

  const amanda = await viem.deployContract("AmandaMemorial", [
    amandaConfig.name,
    amandaConfig.symbol,
    amandaConfig.mintPriceWei,
    staking.address,
    roty.address,
    melting.address,
    MINT_TREASURY_ADDRESS,
    ROYALTY_RECEIVER_ADDRESS,
    amandaConfig.unrevealedURI,
    amandaConfig.revealedBaseURI,
    initialOwner,
  ]);

  console.log("Amanda deployed.", {
    address: amanda.address,
    name: amandaConfig.name,
    symbol: amandaConfig.symbol,
  });

  // 7. Register Amanda.
  await staking.write.setCollectionApproved([amanda.address, true]);

  const amandaApproved = await staking.read.approvedCollection([
    amanda.address,
  ]);

  if (!amandaApproved) {
    throw new Error("Amanda registration failed.");
  }

  console.log("Amanda approved in staking.", {
    amanda: amanda.address,
    staking: staking.address,
    approved: amandaApproved,
  });

  // 8. Deploy local mock $OiOi.
  const mockOiOi = await viem.deployContract("MockERC20", [
    MOCK_OIOI_NAME,
    MOCK_OIOI_SYMBOL,
    deployer.account.address,
    MOCK_OIOI_SUPPLY,
  ]);

  console.log("Mock $OiOi deployed.", {
    address: mockOiOi.address,
    name: MOCK_OIOI_NAME,
    symbol: MOCK_OIOI_SYMBOL,
    supply: MOCK_OIOI_SUPPLY.toString(),
  });

  // 9. Deploy reward distributor with local mock $OiOi.
  const rewardDistributor = await viem.deployContract("OiOiRewardDistributor", [
    mockOiOi.address,
    initialOwner,
  ]);

  console.log("OiOiRewardDistributor deployed.", {
    address: rewardDistributor.address,
    rewardToken: mockOiOi.address,
  });

  // 10. Sanity reads.
  const rotyName = await roty.read.name();
  const meltingName = await melting.read.name();
  const amandaName = await amanda.read.name();
  const rewardToken = await rewardDistributor.read.rewardToken();

  console.log("Sanity checks.", {
    rotyName,
    meltingName,
    amandaName,
    rewardToken,
  });

  // 11. Write deployment record.
  const record = createBaseDeploymentRecord({
    networkKey: config.key,
    chainId: config.chainId,
    label: config.label,
    oioiToken: mockOiOi.address,
  });

  record.contracts.roty = roty.address;
  record.contracts.staking = staking.address;
  record.contracts.melting = melting.address;
  record.contracts.amanda = amanda.address;
  record.contracts.rewardDistributor = rewardDistributor.address;

  record.registrations.rotyApprovedInStaking = true;
  record.registrations.meltingApprovedInStaking = true;
  record.registrations.amandaApprovedInStaking = true;

  writeDeploymentRecord(
    config.deploymentOutputDir,
    touchDeploymentRecord(record),
  );

  console.log("Full local smoke deployment complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
