import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress, parseEther, zeroHash, type Address } from "viem";

const TREASURY_ASSERTION_NOTE = "treasury should receive paid mint ETH";

const ROTY_NAME = "ROTY dETH";
const ROTY_SYMBOL = "ROTYDETH";
const ROTY_PRICE = parseEther("0.01047");
const ROTY_UNREVEALED_URI =
  "ipfs://bafkreiefsmbkjgw3fs47v52xu6zqzbgw4z2fhdsgvaczh7gstn4txurv2m";
const ROTY_REVEALED_BASE_URI =
  "ipfs://bafybeigzgy6jngo4lvdqukwge2e3nwtgmnt7kpkmg7p2mmi2zrr5atmm3a/";

const MELTING_NAME = "Melting dETH";
const MELTING_SYMBOL = "MELTDETH";
const MELTING_PRICE = parseEther("0.01747");
const MELTING_UNREVEALED_URI =
  "ipfs://bafkreiccvibarcxlaq3q2vm23p4jsbtxizkjneivjokh4srdpsi36zzzdi";
const MELTING_REVEALED_BASE_URI = "ipfs://melting-deth-revealed/";

const AMANDA_NAME = "Amanda dETH";
const AMANDA_SYMBOL = "AMANDETH";
const AMANDA_PRICE = parseEther("0.02020");
const AMANDA_UNREVEALED_URI =
  "ipfs://bafkreihvdfz5un5mslexhs2u5zagfw2dsw62hnvt3unvaypiijtyco7agy";
const AMANDA_REVEALED_BASE_URI = "ipfs://amanda-deth-revealed/";

const OIOI_NAME = "OiOi Token";
const OIOI_SYMBOL = "OiOi";
const OIOI_INITIAL_SUPPLY = parseEther("47474747");

const ROUND_ID = 1n;
const PERIOD_START = 1_700_000_000n;
const PERIOD_END = 1_700_086_400n;
const REWARD_AMOUNT = parseEther("100");
const USER_REWARD_AMOUNT = parseEther("100");

function sameAddress(a: unknown, b: unknown) {
  assert.equal(typeof a, "string");
  assert.equal(typeof b, "string");

  return getAddress(a as Address) === getAddress(b as Address);
}

describe("Ethereum lifecycle integration", function () {
  it("runs ROTY dETH mint → stake → Melting dETH mint → stake → Amanda dETH mint → reward claim", async function () {
    const { viem } = await network.connect();

    const [owner, treasury, royaltyReceiver, user] =
      await viem.getWalletClients();

    const publicClient = await viem.getPublicClient();

    // 1. Deploy ROTY dETH with temporary root, then set root for user.
    const roty = await viem.deployContract("TheRotyMemorial", [
      ROTY_NAME,
      ROTY_SYMBOL,
      ROTY_PRICE,
      zeroHash,
      treasury.account.address,
      royaltyReceiver.account.address,
      ROTY_UNREVEALED_URI,
      ROTY_REVEALED_BASE_URI,
      owner.account.address,
    ]);

    const whitelistRoot = (await roty.read.whitelistLeaf([
      user.account.address,
    ])) as `0x${string}`;

    await roty.write.setMerkleRoot([whitelistRoot]);
    await roty.write.setWhitelistMintEnabled([true]);
    await roty.write.setPublicMintEnabled([true]);

    // 2. User whitelist mints ROTY dETH for free.
    const emptyProof = [] as `0x${string}`[];

    await roty.write.whitelistMint([emptyProof], {
      account: user.account,
    });

    assert.equal(await roty.read.totalMinted(), 1n);
    assert.equal(
      sameAddress(await roty.read.ownerOf([1n]), user.account.address),
      true,
    );
    assert.equal(await roty.read.whitelistClaimed([user.account.address]), true);

    // 3. Deploy staking and register ROTY dETH.
    const staking = await viem.deployContract("OiOiSoftStaking", [
      owner.account.address,
    ]);

    await staking.write.setCollectionApproved([roty.address, true]);

    // 4. User stakes ROTY dETH non-custodially.
    await staking.write.stake([roty.address, 1n], {
      account: user.account,
    });

    assert.equal(await staking.read.hasValidStake([user.account.address, roty.address]), true);

    // 5. Deploy Melting dETH with ROTY dETH stake requirement.
    const melting = await viem.deployContract("MeltingMemorial", [
      MELTING_NAME,
      MELTING_SYMBOL,
      MELTING_PRICE,
      staking.address,
      roty.address,
      treasury.account.address,
      royaltyReceiver.account.address,
      MELTING_UNREVEALED_URI,
      MELTING_REVEALED_BASE_URI,
      owner.account.address,
    ]);

    await melting.write.setGatedMintEnabled([true]);

    const treasuryBeforeMelting = await publicClient.getBalance({
      address: treasury.account.address,
    });

    // 6. User mints Melting dETH through staking-gated paid mint.
    await melting.write.mint([1n], {
      account: user.account,
      value: MELTING_PRICE,
    });

    const treasuryAfterMelting = await publicClient.getBalance({
      address: treasury.account.address,
    });

    assert.equal(await melting.read.totalMinted(), 1n);
    assert.equal(
      sameAddress(await melting.read.ownerOf([1n]), user.account.address),
      true,
    );
    assert.equal(
      treasuryAfterMelting - treasuryBeforeMelting,
      MELTING_PRICE,
      TREASURY_ASSERTION_NOTE,
    );

    // 7. Register and stake Melting dETH.
    await staking.write.setCollectionApproved([melting.address, true]);

    await staking.write.stake([melting.address, 1n], {
      account: user.account,
    });

    assert.equal(await staking.read.hasValidStake([user.account.address, melting.address]), true);

    // 8. Deploy Amanda dETH with ROTY dETH or Melting dETH stake requirement.
    const amanda = await viem.deployContract("AmandaMemorial", [
      AMANDA_NAME,
      AMANDA_SYMBOL,
      AMANDA_PRICE,
      staking.address,
      roty.address,
      melting.address,
      treasury.account.address,
      royaltyReceiver.account.address,
      AMANDA_UNREVEALED_URI,
      AMANDA_REVEALED_BASE_URI,
      owner.account.address,
    ]);

    await amanda.write.setGatedMintEnabled([true]);

    const treasuryBeforeAmanda = await publicClient.getBalance({
      address: treasury.account.address,
    });

    // 9. User mints Amanda dETH through staking-gated paid mint.
    await amanda.write.mint([1n], {
      account: user.account,
      value: AMANDA_PRICE,
    });

    const treasuryAfterAmanda = await publicClient.getBalance({
      address: treasury.account.address,
    });

    assert.equal(await amanda.read.totalMinted(), 1n);
    assert.equal(
      sameAddress(await amanda.read.ownerOf([1n]), user.account.address),
      true,
    );
    assert.equal(
      treasuryAfterAmanda - treasuryBeforeAmanda,
      AMANDA_PRICE,
      TREASURY_ASSERTION_NOTE,
    );

    // 10. Register Amanda dETH and stake it too.
    await staking.write.setCollectionApproved([amanda.address, true]);

    await staking.write.stake([amanda.address, 1n], {
      account: user.account,
    });

    assert.equal(await staking.read.hasValidStake([user.account.address, amanda.address]), true);

    // 11. Deploy $OiOi mock token and Ethereum reward distributor.
    const oioi = await viem.deployContract("MockERC20", [
      OIOI_NAME,
      OIOI_SYMBOL,
      owner.account.address,
      OIOI_INITIAL_SUPPLY,
    ]);

    const distributor = await viem.deployContract("OiOiRewardDistributor", [
      oioi.address,
      owner.account.address,
    ]);

    const rewardRoot = (await distributor.read.rewardLeaf([
      ROUND_ID,
      user.account.address,
      USER_REWARD_AMOUNT,
    ])) as `0x${string}`;

    await distributor.write.createRewardRound([
      ROUND_ID,
      PERIOD_START,
      PERIOD_END,
      REWARD_AMOUNT,
      rewardRoot,
    ]);

    await oioi.write.approve([distributor.address, REWARD_AMOUNT], {
      account: owner.account,
    });

    await distributor.write.fundRewardRound([ROUND_ID, REWARD_AMOUNT]);

    assert.equal(await distributor.read.isRoundFunded([ROUND_ID]), true);

    // 12. User claims $OiOi reward.
    const userRewardBefore = (await oioi.read.balanceOf([
      user.account.address,
    ])) as bigint;

    await distributor.write.claim([ROUND_ID, USER_REWARD_AMOUNT, emptyProof], {
      account: user.account,
    });

    const userRewardAfter = (await oioi.read.balanceOf([
      user.account.address,
    ])) as bigint;

    assert.equal(userRewardAfter - userRewardBefore, USER_REWARD_AMOUNT);
    assert.equal(await distributor.read.hasClaimed([ROUND_ID, user.account.address]), true);

    // 13. Final sanity checks.
    assert.equal(await roty.read.totalMinted(), 1n);
    assert.equal(await melting.read.totalMinted(), 1n);
    assert.equal(await amanda.read.totalMinted(), 1n);

    assert.equal(await staking.read.hasValidStake([user.account.address, roty.address]), true);
    assert.equal(await staking.read.hasValidStake([user.account.address, melting.address]), true);
    assert.equal(await staking.read.hasValidStake([user.account.address, amanda.address]), true);
  });
});
