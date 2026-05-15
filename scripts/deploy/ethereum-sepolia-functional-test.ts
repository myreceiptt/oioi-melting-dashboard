import { network } from "hardhat";
import { getAddress, parseEther, type Address, type TransactionReceipt } from "viem";

import { DEPLOYER_ADDRESS, getDeployConfig } from "./00-config.js";
import { readDeploymentRecord } from "./deployment-state.js";

const REWARD_AMOUNT = parseEther("1");
const STATE_RETRY_ATTEMPTS = 20;
const STATE_RETRY_DELAY_MS = 3_000;

function sameAddress(a: unknown, b: unknown) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  return getAddress(a as Address) === getAddress(b as Address);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const connection = await network.create();
  const { viem } = connection;
  const publicClient = await viem.getPublicClient();

  async function waitForTx(hash: `0x${string}`, label: string): Promise<TransactionReceipt> {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 2,
      retryCount: 30,
      retryDelay: 2_000,
    });

    if (receipt.status !== "success") {
      throw new Error(`${label} failed. tx=${hash}`);
    }

    console.log(`${label} mined.`, {
      tx: hash,
      blockNumber: receipt.blockNumber.toString(),
    });

    return receipt;
  }

  async function waitForCondition(label: string, check: () => Promise<boolean>) {
    for (let attempt = 1; attempt <= STATE_RETRY_ATTEMPTS; attempt++) {
      if (await check()) {
        console.log(`${label} confirmed.`, { attempt });
        return;
      }

      console.log(`${label} not visible yet; retrying...`, {
        attempt,
        maxAttempts: STATE_RETRY_ATTEMPTS,
      });

      await sleep(STATE_RETRY_DELAY_MS);
    }

    throw new Error(`${label} was not confirmed after waiting.`);
  }

  const networkName = connection.networkName;

  if (networkName !== "ethereumSepolia") {
    throw new Error(`This script is only for ethereumSepolia. Got: ${networkName}`);
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
    throw new Error("Ethereum Sepolia deployment record is incomplete.");
  }

  const [deployer] = await viem.getWalletClients();
  const deployerAddress = getAddress(deployer.account.address);
  const expectedDeployer = getAddress(DEPLOYER_ADDRESS);

  if (deployerAddress !== expectedDeployer) {
    throw new Error(`Wrong deployer. Got ${deployerAddress}, expected ${expectedDeployer}`);
  }

  console.log("Running Ethereum Sepolia functional test...");
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

  if (!sameAddress(await melting.read.owner(), deployerAddress)) {
    throw new Error("Deployer is not Melting owner.");
  }

  if (!sameAddress(await amanda.read.owner(), deployerAddress)) {
    throw new Error("Deployer is not Amanda owner.");
  }

  if (!sameAddress(await distributor.read.owner(), deployerAddress)) {
    throw new Error("Deployer is not RewardDistributor owner.");
  }

  const initialRotyPublicMintEnabled = (await roty.read.publicMintEnabled()) as boolean;
  const initialMeltingGatedMintEnabled = (await melting.read.gatedMintEnabled()) as boolean;
  const initialAmandaGatedMintEnabled = (await amanda.read.gatedMintEnabled()) as boolean;

  const rotyPrice = (await roty.read.mintPrice()) as bigint;
  const meltingPrice = (await melting.read.mintPrice()) as bigint;
  const amandaPrice = (await amanda.read.mintPrice()) as bigint;

  try {
    console.log("Enabling ROTY public mint for functional test...");
    if (!initialRotyPublicMintEnabled) {
      const tx = await roty.write.setPublicMintEnabled([true]);
      await waitForTx(tx, "ROTY public mint enabled");
      await waitForCondition(
        "ROTY public mint enabled state",
        async () => (await roty.read.publicMintEnabled()) === true,
      );
    }

    const rotyTokenId = ((await roty.read.totalMinted()) as bigint) + 1n;

    console.log("Minting ROTY public mint...");
    const rotyMintTx = await roty.write.publicMint([1n], {
      account: deployer.account,
      value: rotyPrice,
    });
    await waitForTx(rotyMintTx, "ROTY public mint");

    console.log("ROTY minted.", { rotyTokenId: rotyTokenId.toString() });

    await waitForCondition(
      "ROTY ownerOf minted token",
      async () => sameAddress(await roty.read.ownerOf([rotyTokenId]), deployerAddress),
    );

    console.log("Staking ROTY...");
    const rotyStakeTx = await staking.write.stake([record.contracts.roty, rotyTokenId], {
      account: deployer.account,
    });
    await waitForTx(rotyStakeTx, "ROTY stake");

    await waitForCondition(
      "ROTY stake valid",
      async () =>
        (await staking.read.hasValidStake([deployerAddress, record.contracts.roty])) === true,
    );

    console.log("ROTY stake valid.");

    console.log("Enabling Melting gated mint for functional test...");
    if (!initialMeltingGatedMintEnabled) {
      const tx = await melting.write.setGatedMintEnabled([true]);
      await waitForTx(tx, "Melting gated mint enabled");
      await waitForCondition(
        "Melting gated mint enabled state",
        async () => (await melting.read.gatedMintEnabled()) === true,
      );
    }

    const meltingTokenId = ((await melting.read.totalMinted()) as bigint) + 1n;

    console.log("Minting Melting...");
    const meltingMintTx = await melting.write.mint([1n], {
      account: deployer.account,
      value: meltingPrice,
    });
    await waitForTx(meltingMintTx, "Melting mint");

    console.log("Melting minted.", { meltingTokenId: meltingTokenId.toString() });

    await waitForCondition(
      "Melting ownerOf minted token",
      async () => sameAddress(await melting.read.ownerOf([meltingTokenId]), deployerAddress),
    );

    console.log("Staking Melting...");
    const meltingStakeTx = await staking.write.stake([record.contracts.melting, meltingTokenId], {
      account: deployer.account,
    });
    await waitForTx(meltingStakeTx, "Melting stake");

    await waitForCondition(
      "Melting stake valid",
      async () =>
        (await staking.read.hasValidStake([deployerAddress, record.contracts.melting])) === true,
    );

    console.log("Melting stake valid.");

    console.log("Enabling Amanda gated mint for functional test...");
    if (!initialAmandaGatedMintEnabled) {
      const tx = await amanda.write.setGatedMintEnabled([true]);
      await waitForTx(tx, "Amanda gated mint enabled");
      await waitForCondition(
        "Amanda gated mint enabled state",
        async () => (await amanda.read.gatedMintEnabled()) === true,
      );
    }

    const amandaTokenId = ((await amanda.read.totalMinted()) as bigint) + 1n;

    console.log("Minting Amanda...");
    const amandaMintTx = await amanda.write.mint([1n], {
      account: deployer.account,
      value: amandaPrice,
    });
    await waitForTx(amandaMintTx, "Amanda mint");

    console.log("Amanda minted.", { amandaTokenId: amandaTokenId.toString() });

    await waitForCondition(
      "Amanda ownerOf minted token",
      async () => sameAddress(await amanda.read.ownerOf([amandaTokenId]), deployerAddress),
    );

    console.log("Staking Amanda...");
    const amandaStakeTx = await staking.write.stake([record.contracts.amanda, amandaTokenId], {
      account: deployer.account,
    });
    await waitForTx(amandaStakeTx, "Amanda stake");

    await waitForCondition(
      "Amanda stake valid",
      async () =>
        (await staking.read.hasValidStake([deployerAddress, record.contracts.amanda])) === true,
    );

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

    const createRoundTx = await distributor.write.createRewardRound([
      roundId,
      periodStart,
      periodEnd,
      REWARD_AMOUNT,
      rewardRoot,
    ]);
    await waitForTx(createRoundTx, "Reward round creation");

    console.log("Approving $OiOi funding...");
    const approveTx = await oioi.write.approve([record.contracts.rewardDistributor, REWARD_AMOUNT], {
      account: deployer.account,
    });
    await waitForTx(approveTx, "$OiOi funding approval");

    console.log("Funding reward round...");
    const fundTx = await distributor.write.fundRewardRound([roundId, REWARD_AMOUNT]);
    await waitForTx(fundTx, "Reward round funding");

    await waitForCondition(
      "Reward round funded",
      async () => (await distributor.read.isRoundFunded([roundId])) === true,
    );

    const beforeClaim = (await oioi.read.balanceOf([deployerAddress])) as bigint;

    console.log("Claiming reward...");
    const emptyProof = [] as `0x${string}`[];

    const claimTx = await distributor.write.claim([roundId, REWARD_AMOUNT, emptyProof], {
      account: deployer.account,
    });
    await waitForTx(claimTx, "Reward claim");

    await waitForCondition(
      "Reward claim status",
      async () => (await distributor.read.hasClaimed([roundId, deployerAddress])) === true,
    );

    const afterClaim = (await oioi.read.balanceOf([deployerAddress])) as bigint;

    if (afterClaim - beforeClaim !== REWARD_AMOUNT) {
      throw new Error("Reward claim amount mismatch.");
    }

    console.log("Reward claim succeeded.", {
      roundId: roundId.toString(),
      amount: REWARD_AMOUNT.toString(),
    });

    console.log("✅ Ethereum Sepolia functional test passed.");
  } finally {
    console.log("Restoring mint phase states...");

    if ((await roty.read.publicMintEnabled()) !== initialRotyPublicMintEnabled) {
      const tx = await roty.write.setPublicMintEnabled([initialRotyPublicMintEnabled]);
      await waitForTx(tx, "ROTY public mint restored");
      await waitForCondition(
        "ROTY public mint restored state",
        async () => (await roty.read.publicMintEnabled()) === initialRotyPublicMintEnabled,
      );
    }

    if ((await melting.read.gatedMintEnabled()) !== initialMeltingGatedMintEnabled) {
      const tx = await melting.write.setGatedMintEnabled([initialMeltingGatedMintEnabled]);
      await waitForTx(tx, "Melting gated mint restored");
      await waitForCondition(
        "Melting gated mint restored state",
        async () => (await melting.read.gatedMintEnabled()) === initialMeltingGatedMintEnabled,
      );
    }

    if ((await amanda.read.gatedMintEnabled()) !== initialAmandaGatedMintEnabled) {
      const tx = await amanda.write.setGatedMintEnabled([initialAmandaGatedMintEnabled]);
      await waitForTx(tx, "Amanda gated mint restored");
      await waitForCondition(
        "Amanda gated mint restored state",
        async () => (await amanda.read.gatedMintEnabled()) === initialAmandaGatedMintEnabled,
      );
    }

    console.log("Mint phase states restored.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
