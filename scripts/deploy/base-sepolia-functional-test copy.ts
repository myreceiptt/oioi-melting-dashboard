import { network } from "hardhat";
import { getAddress, parseEther, type Address } from "viem";

import { DEPLOYER_ADDRESS, getDeployConfig } from "./00-config.js";
import { readDeploymentRecord } from "./deployment-state.js";

const REWARD_AMOUNT = parseEther("1");

function sameAddress(a: unknown, b: unknown) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  return getAddress(a as Address) === getAddress(b as Address);
}

async function main() {
  const connection = await network.create();
  const { viem } = connection;

  const networkName = connection.networkName;

  if (networkName !== "baseSepolia") {
    throw new Error(`This script is only for baseSepolia. Got: ${networkName}`);
  }

  const config = getDeployConfig(networkName);
  const record = readDeploymentRecord(config.deploymentOutputDir);

  if (
    !record?.contracts.roty ||
    !record.contracts.staking ||
    !record.contracts.melting ||
    !record.contracts.amanda ||
    !record.contracts.rewardDistributor
  ) {
    throw new Error("Base Sepolia deployment record is incomplete.");
  }

  const [deployer] = await viem.getWalletClients();
  const deployerAddress = getAddress(deployer.account.address);
  const expectedDeployer = getAddress(DEPLOYER_ADDRESS);

  if (deployerAddress !== expectedDeployer) {
    throw new Error(`Wrong deployer. Got ${deployerAddress}, expected ${expectedDeployer}`);
  }

  console.log("Running Base Sepolia functional test...");
  console.log({
    deployer: deployerAddress,
    contracts: record.contracts,
    oioi: record.tokens.oioi,
  });

  const roty = await viem.getContractAt("TheRotyMemorial", record.contracts.roty);
  const staking = await viem.getContractAt("OiOiSoftStaking", record.contracts.staking);
  const melting = await viem.getContractAt("MeltingMemorial", record.contracts.melting);
  const amanda = await viem.getContractAt("AmandaMemorial", record.contracts.amanda);
  const distributor = await viem.getContractAt(
    "OiOiRewardDistributor",
    record.contracts.rewardDistributor,
  );
  const oioi = await viem.getContractAt("MockERC20", record.tokens.oioi);

  if (!sameAddress(await roty.read.owner(), deployerAddress)) {
    throw new Error("Deployer is not ROTY owner.");
  }

  const initialRotyPublicMintEnabled = (await roty.read.publicMintEnabled()) as boolean;
  const initialMeltingGatedMintEnabled = (await melting.read.gatedMintEnabled()) as boolean;
  const initialAmandaGatedMintEnabled = (await amanda.read.gatedMintEnabled()) as boolean;

  const rotyPrice = (await roty.read.mintPrice()) as bigint;
  const meltingPrice = (await melting.read.mintPrice()) as bigint;
  const amandaPrice = (await amanda.read.mintPrice()) as bigint;

  const rotyTokenId = ((await roty.read.totalMinted()) as bigint) + 1n;

  try {
    console.log("Enabling ROTY public mint for functional test...");
    if (!initialRotyPublicMintEnabled) {
      await roty.write.setPublicMintEnabled([true]);
    }

    console.log("Minting ROTY public mint...");
    await roty.write.publicMint([1n], {
      account: deployer.account,
      value: rotyPrice,
    });

    console.log("ROTY minted.", { rotyTokenId: rotyTokenId.toString() });

    console.log("Staking ROTY...");
    await staking.write.stake([record.contracts.roty, rotyTokenId], {
      account: deployer.account,
    });

    const rotyStakeValid = await staking.read.hasValidStake([
      deployerAddress,
      record.contracts.roty,
    ]);

    if (!rotyStakeValid) {
      throw new Error("ROTY stake is not valid after staking.");
    }

    console.log("ROTY stake valid.");

    const meltingTokenId = ((await melting.read.totalMinted()) as bigint) + 1n;

    console.log("Enabling Melting gated mint for functional test...");
    if (!initialMeltingGatedMintEnabled) {
      await melting.write.setGatedMintEnabled([true]);
    }

    console.log("Minting Melting...");
    await melting.write.mint([1n], {
      account: deployer.account,
      value: meltingPrice,
    });

    console.log("Melting minted.", { meltingTokenId: meltingTokenId.toString() });

    console.log("Staking Melting...");
    await staking.write.stake([record.contracts.melting, meltingTokenId], {
      account: deployer.account,
    });

    const meltingStakeValid = await staking.read.hasValidStake([
      deployerAddress,
      record.contracts.melting,
    ]);

    if (!meltingStakeValid) {
      throw new Error("Melting stake is not valid after staking.");
    }

    console.log("Melting stake valid.");

    const amandaTokenId = ((await amanda.read.totalMinted()) as bigint) + 1n;

    console.log("Enabling Amanda gated mint for functional test...");
    if (!initialAmandaGatedMintEnabled) {
      await amanda.write.setGatedMintEnabled([true]);
    }

    console.log("Minting Amanda...");
    await amanda.write.mint([1n], {
      account: deployer.account,
      value: amandaPrice,
    });

    console.log("Amanda minted.", { amandaTokenId: amandaTokenId.toString() });

    console.log("Staking Amanda...");
    await staking.write.stake([record.contracts.amanda, amandaTokenId], {
      account: deployer.account,
    });

    const amandaStakeValid = await staking.read.hasValidStake([
      deployerAddress,
      record.contracts.amanda,
    ]);

    if (!amandaStakeValid) {
      throw new Error("Amanda stake is not valid after staking.");
    }

    console.log("Amanda stake valid.");

    const oioiBalance = (await oioi.read.balanceOf([deployerAddress])) as bigint;

    if (oioiBalance < REWARD_AMOUNT) {
      throw new Error(
        `Not enough testnet $OiOi for reward test. Balance=${oioiBalance.toString()} Required=${REWARD_AMOUNT.toString()}`,
      );
    }

    const roundId = BigInt(Math.floor(Date.now() / 1000));
    const periodEnd = BigInt(Math.floor(Date.now() / 1000));
    const periodStart = periodEnd - 86_400n;

    const rewardRoot = (await distributor.read.rewardLeaf([
      roundId,
      deployerAddress,
      REWARD_AMOUNT,
    ])) as `0x${string}`;

    console.log("Creating reward round...", {
      roundId: roundId.toString(),
      rewardRoot,
    });

    await distributor.write.createRewardRound([
      roundId,
      periodStart,
      periodEnd,
      REWARD_AMOUNT,
      rewardRoot,
    ]);

    console.log("Approving $OiOi funding...");
    await oioi.write.approve([record.contracts.rewardDistributor, REWARD_AMOUNT], {
      account: deployer.account,
    });

    console.log("Funding reward round...");
    await distributor.write.fundRewardRound([roundId, REWARD_AMOUNT]);

    const roundFunded = await distributor.read.isRoundFunded([roundId]);

    if (!roundFunded) {
      throw new Error("Reward round is not funded after funding.");
    }

    const beforeClaim = (await oioi.read.balanceOf([deployerAddress])) as bigint;

    console.log("Claiming reward...");
    const emptyProof = [] as `0x${string}`[];

    await distributor.write.claim([roundId, REWARD_AMOUNT, emptyProof], {
      account: deployer.account,
    });

    const afterClaim = (await oioi.read.balanceOf([deployerAddress])) as bigint;

    if (afterClaim - beforeClaim !== REWARD_AMOUNT) {
      throw new Error("Reward claim amount mismatch.");
    }

    const claimed = await distributor.read.hasClaimed([roundId, deployerAddress]);

    if (!claimed) {
      throw new Error("Reward claim status is false after claim.");
    }

    console.log("Reward claim succeeded.", {
      roundId: roundId.toString(),
      amount: REWARD_AMOUNT.toString(),
    });

    console.log("✅ Base Sepolia functional test passed.");
  } finally {
    console.log("Restoring mint phase states...");

    if ((await roty.read.publicMintEnabled()) !== initialRotyPublicMintEnabled) {
      await roty.write.setPublicMintEnabled([initialRotyPublicMintEnabled]);
    }

    if ((await melting.read.gatedMintEnabled()) !== initialMeltingGatedMintEnabled) {
      await melting.write.setGatedMintEnabled([initialMeltingGatedMintEnabled]);
    }

    if ((await amanda.read.gatedMintEnabled()) !== initialAmandaGatedMintEnabled) {
      await amanda.write.setGatedMintEnabled([initialAmandaGatedMintEnabled]);
    }

    console.log("Mint phase states restored.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
