import { network } from "hardhat";
import { getAddress, parseEther, type Address } from "viem";

import {
  DEPLOYER_ADDRESS,
  MINT_TREASURY_ADDRESS,
  ROYALTY_RECEIVER_ADDRESS,
  getDeployConfig,
} from "./00-config.js";
import { readDeploymentRecord } from "./deployment-state.js";
import { readRotyMerkleRoot } from "./whitelist-root.js";

function sameAddress(a: unknown, b: unknown) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  return getAddress(a as Address) === getAddress(b as Address);
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(
      `${label} mismatch. Actual=${String(actual)} Expected=${String(expected)}`,
    );
  }

  console.log(`✅ ${label}`, actual);
}

function assertAddress(label: string, actual: unknown, expected: unknown) {
  if (!sameAddress(actual, expected)) {
    throw new Error(
      `${label} mismatch. Actual=${String(actual)} Expected=${String(expected)}`,
    );
  }

  console.log(`✅ ${label}`, actual);
}

async function main() {
  const connection = await network.create();
  const { viem } = connection;

  const networkName = connection.networkName;
  const config = getDeployConfig(networkName);
  const record = readDeploymentRecord(config.deploymentOutputDir);

  if (!record) {
    throw new Error(`Missing deployment record for ${networkName}`);
  }

  if (
    !record.contracts.roty ||
    !record.contracts.staking ||
    !record.contracts.melting ||
    !record.contracts.amanda ||
    !record.contracts.rewardDistributor
  ) {
    throw new Error(`Deployment record for ${networkName} is incomplete.`);
  }

  console.log("Running read-only deployment checks...");
  console.log({
    network: networkName,
    chainId: config.chainId,
    label: config.label,
    contracts: record.contracts,
    oioi: record.tokens.oioi,
  });

  const roty = await viem.getContractAt(
    "TheRotyMemorial",
    record.contracts.roty,
  );
  const staking = await viem.getContractAt(
    "OiOiSoftStaking",
    record.contracts.staking,
  );
  const melting = await viem.getContractAt(
    "MeltingMemorial",
    record.contracts.melting,
  );
  const amanda = await viem.getContractAt(
    "AmandaMemorial",
    record.contracts.amanda,
  );
  const rewardDistributor = await viem.getContractAt(
    "OiOiRewardDistributor",
    record.contracts.rewardDistributor,
  );
  const rewardToken = await viem.getContractAt("MockERC20", record.tokens.oioi);

  const salePrice = parseEther("1");

  console.log("\nROTY checks");
  assertEqual(
    "ROTY name",
    await roty.read.name(),
    config.collections.roty.name,
  );
  assertEqual(
    "ROTY symbol",
    await roty.read.symbol(),
    config.collections.roty.symbol,
  );
  assertAddress("ROTY owner", await roty.read.owner(), DEPLOYER_ADDRESS);
  assertEqual("ROTY maxSupply", await roty.read.maxSupply(), 1047n);
  assertEqual("ROTY maxMintPerTx", await roty.read.maxMintPerTx(), 11n);
  assertEqual(
    "ROTY mintPrice",
    await roty.read.mintPrice(),
    config.collections.roty.mintPriceWei,
  );
  assertAddress(
    "ROTY treasury",
    await roty.read.treasury(),
    MINT_TREASURY_ADDRESS,
  );
  assertEqual(
    "ROTY unrevealedURI",
    await roty.read.unrevealedURI(),
    config.collections.roty.unrevealedURI,
  );
  assertEqual(
    "ROTY revealedBaseURI",
    await roty.read.revealedBaseURI(),
    config.collections.roty.revealedBaseURI,
  );
  assertEqual("ROTY revealed", await roty.read.revealed(), false);
  assertEqual("ROTY metadataLocked", await roty.read.metadataLocked(), false);
  assertEqual(
    "ROTY whitelistMintEnabled",
    await roty.read.whitelistMintEnabled(),
    true,
  );
  assertEqual(
    "ROTY publicMintEnabled",
    await roty.read.publicMintEnabled(),
    true,
  );
  assertEqual(
    "ROTY merkleRoot",
    await roty.read.merkleRoot(),
    readRotyMerkleRoot(),
  );

  const [rotyRoyaltyReceiver, rotyRoyaltyAmount] = (await roty.read.royaltyInfo(
    [1n, salePrice],
  )) as readonly [Address, bigint];

  assertAddress(
    "ROTY royalty receiver",
    rotyRoyaltyReceiver,
    ROYALTY_RECEIVER_ADDRESS,
  );
  assertEqual(
    "ROTY royalty amount for 1 ETH sale",
    rotyRoyaltyAmount,
    parseEther("0.11"),
  );

  console.log("\nStaking checks");
  assertAddress("Staking owner", await staking.read.owner(), DEPLOYER_ADDRESS);
  assertEqual(
    "ROTY approved in staking",
    await staking.read.approvedCollection([record.contracts.roty]),
    true,
  );
  assertEqual(
    "Melting approved in staking",
    await staking.read.approvedCollection([record.contracts.melting]),
    true,
  );
  assertEqual(
    "Amanda approved in staking",
    await staking.read.approvedCollection([record.contracts.amanda]),
    true,
  );

  console.log("\nMelting checks");
  assertEqual(
    "Melting name",
    await melting.read.name(),
    config.collections.melting.name,
  );
  assertEqual(
    "Melting symbol",
    await melting.read.symbol(),
    config.collections.melting.symbol,
  );
  assertAddress("Melting owner", await melting.read.owner(), DEPLOYER_ADDRESS);
  assertEqual("Melting maxSupply", await melting.read.maxSupply(), 1747n);
  assertEqual("Melting maxMintPerTx", await melting.read.maxMintPerTx(), 11n);
  assertEqual(
    "Melting mintPrice",
    await melting.read.mintPrice(),
    config.collections.melting.mintPriceWei,
  );
  assertAddress(
    "Melting treasury",
    await melting.read.treasury(),
    MINT_TREASURY_ADDRESS,
  );
  assertAddress(
    "Melting stakingContract",
    await melting.read.stakingContract(),
    record.contracts.staking,
  );
  assertAddress(
    "Melting rotyCollection",
    await melting.read.rotyCollection(),
    record.contracts.roty,
  );
  assertEqual(
    "Melting unrevealedURI",
    await melting.read.unrevealedURI(),
    config.collections.melting.unrevealedURI,
  );
  assertEqual("Melting revealed", await melting.read.revealed(), false);
  assertEqual(
    "Melting metadataLocked",
    await melting.read.metadataLocked(),
    false,
  );
  assertEqual(
    "Melting gatedMintEnabled",
    await melting.read.gatedMintEnabled(),
    true,
  );

  const [meltingRoyaltyReceiver, meltingRoyaltyAmount] =
    (await melting.read.royaltyInfo([1n, salePrice])) as readonly [
      Address,
      bigint,
    ];

  assertAddress(
    "Melting royalty receiver",
    meltingRoyaltyReceiver,
    ROYALTY_RECEIVER_ADDRESS,
  );
  assertEqual(
    "Melting royalty amount for 1 ETH sale",
    meltingRoyaltyAmount,
    parseEther("0.11"),
  );

  console.log("\nAmanda checks");
  assertEqual(
    "Amanda name",
    await amanda.read.name(),
    config.collections.amanda.name,
  );
  assertEqual(
    "Amanda symbol",
    await amanda.read.symbol(),
    config.collections.amanda.symbol,
  );
  assertAddress("Amanda owner", await amanda.read.owner(), DEPLOYER_ADDRESS);
  assertEqual("Amanda maxSupply", await amanda.read.maxSupply(), 2020n);
  assertEqual("Amanda maxMintPerTx", await amanda.read.maxMintPerTx(), 11n);
  assertEqual(
    "Amanda mintPrice",
    await amanda.read.mintPrice(),
    config.collections.amanda.mintPriceWei,
  );
  assertAddress(
    "Amanda treasury",
    await amanda.read.treasury(),
    MINT_TREASURY_ADDRESS,
  );
  assertAddress(
    "Amanda stakingContract",
    await amanda.read.stakingContract(),
    record.contracts.staking,
  );
  assertAddress(
    "Amanda rotyCollection",
    await amanda.read.rotyCollection(),
    record.contracts.roty,
  );
  assertAddress(
    "Amanda meltingCollection",
    await amanda.read.meltingCollection(),
    record.contracts.melting,
  );
  assertEqual(
    "Amanda unrevealedURI",
    await amanda.read.unrevealedURI(),
    config.collections.amanda.unrevealedURI,
  );
  assertEqual("Amanda revealed", await amanda.read.revealed(), false);
  assertEqual(
    "Amanda metadataLocked",
    await amanda.read.metadataLocked(),
    false,
  );
  assertEqual(
    "Amanda gatedMintEnabled",
    await amanda.read.gatedMintEnabled(),
    true,
  );

  const [amandaRoyaltyReceiver, amandaRoyaltyAmount] =
    (await amanda.read.royaltyInfo([1n, salePrice])) as readonly [
      Address,
      bigint,
    ];

  assertAddress(
    "Amanda royalty receiver",
    amandaRoyaltyReceiver,
    ROYALTY_RECEIVER_ADDRESS,
  );
  assertEqual(
    "Amanda royalty amount for 1 ETH sale",
    amandaRoyaltyAmount,
    parseEther("0.11"),
  );

  console.log("\nRewardDistributor checks");

  assertAddress(
    "RewardDistributor owner",
    await rewardDistributor.read.owner(),
    DEPLOYER_ADDRESS,
  );

  assertAddress(
    "RewardDistributor rewardToken",
    await rewardDistributor.read.rewardToken(),
    record.tokens.oioi,
  );

  const totalRewardFunded =
    (await rewardDistributor.read.totalRewardFunded()) as bigint;

  const totalRewardClaimed =
    (await rewardDistributor.read.totalRewardClaimed()) as bigint;

  if (totalRewardClaimed > totalRewardFunded) {
    throw new Error(
      `RewardDistributor invalid counters. totalRewardClaimed=${totalRewardClaimed.toString()} totalRewardFunded=${totalRewardFunded.toString()}`,
    );
  }

  console.log("✅ RewardDistributor totalRewardFunded", totalRewardFunded);
  console.log("✅ RewardDistributor totalRewardClaimed", totalRewardClaimed);

  const allocatedUnclaimedRewardBalance =
    (await rewardDistributor.read.allocatedUnclaimedRewardBalance()) as bigint;

  const expectedAllocatedUnclaimed = totalRewardFunded - totalRewardClaimed;

  assertEqual(
    "RewardDistributor allocatedUnclaimedRewardBalance",
    allocatedUnclaimedRewardBalance,
    expectedAllocatedUnclaimed,
  );

  const rewardDistributorTokenBalance = (await rewardToken.read.balanceOf([
    record.contracts.rewardDistributor,
  ])) as bigint;

  if (rewardDistributorTokenBalance < allocatedUnclaimedRewardBalance) {
    throw new Error(
      `RewardDistributor token balance is lower than allocated unclaimed rewards. balance=${rewardDistributorTokenBalance.toString()} allocated=${allocatedUnclaimedRewardBalance.toString()}`,
    );
  }

  console.log(
    "✅ RewardDistributor token balance >= allocated unclaimed rewards",
    rewardDistributorTokenBalance,
  );

  const excessRewardTokenBalance =
    (await rewardDistributor.read.excessRewardTokenBalance()) as bigint;

  const expectedExcessRewardTokenBalance =
    rewardDistributorTokenBalance - allocatedUnclaimedRewardBalance;

  assertEqual(
    "RewardDistributor excessRewardTokenBalance",
    excessRewardTokenBalance,
    expectedExcessRewardTokenBalance,
  );

  console.log("\n✅ Read-only deployment checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
