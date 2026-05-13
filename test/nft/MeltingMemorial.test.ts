import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress, parseEther, type Address } from "viem";

const ROTY_NAME = "Mock ROTY";
const ROTY_SYMBOL = "ROTY";
const MELTING_NAME = "Melting BASE";
const MELTING_SYMBOL = "MELTBASE";

const ROTY_MAX_SUPPLY = 10n;
const ROTY_MAX_MINT_PER_TX = 5n;
const ROTY_MINT_PRICE = parseEther("0.001047");

const MELTING_MINT_PRICE = parseEther("0.001747");

const UNREVEALED_URI = "ipfs://melting-unrevealed";
const REVEALED_BASE_URI = "ipfs://melting-revealed/";
const BASE_EXTENSION = ".json";
const ROYALTY_FEE = 1_100;

function sameAddress(a: unknown, b: unknown) {
  assert.equal(typeof a, "string");
  assert.equal(typeof b, "string");

  return getAddress(a as Address) === getAddress(b as Address);
}

async function deployFixture() {
  const { viem } = await network.connect();

  const [owner, treasury, royaltyReceiver, user, other] =
    await viem.getWalletClients();

  const roty = await viem.deployContract("MockMemorialNFTCore", [
    ROTY_NAME,
    ROTY_SYMBOL,
    ROTY_MAX_SUPPLY,
    ROTY_MAX_MINT_PER_TX,
    ROTY_MINT_PRICE,
    treasury.account.address,
    "ipfs://roty-unrevealed",
    "ipfs://roty-revealed/",
    BASE_EXTENSION,
    royaltyReceiver.account.address,
    ROYALTY_FEE,
    owner.account.address,
  ]);

  const staking = await viem.deployContract("OiOiSoftStaking", [
    owner.account.address,
  ]);

  const melting = await viem.deployContract("MeltingMemorial", [
    MELTING_NAME,
    MELTING_SYMBOL,
    MELTING_MINT_PRICE,
    staking.address,
    roty.address,
    treasury.account.address,
    royaltyReceiver.account.address,
    UNREVEALED_URI,
    REVEALED_BASE_URI,
    owner.account.address,
  ]);

  const publicClient = await viem.getPublicClient();

  return {
    roty,
    staking,
    melting,
    publicClient,
    owner,
    treasury,
    royaltyReceiver,
    user,
    other,
  };
}

async function prepareValidRotyStake(
  fixture: Awaited<ReturnType<typeof deployFixture>>,
) {
  const { roty, staking, user } = fixture;

  await roty.write.ownerMint([user.account.address, 1n]);
  await staking.write.setCollectionApproved([roty.address, true]);

  await staking.write.stake([roty.address, 1n], {
    account: user.account,
  });
}

describe("MeltingMemorial", function () {
  it("sets constructor values and dependencies", async function () {
    const { melting, staking, roty, treasury } = await deployFixture();

    assert.equal(await melting.read.name(), MELTING_NAME);
    assert.equal(await melting.read.symbol(), MELTING_SYMBOL);
    assert.equal(await melting.read.MELTING_MAX_SUPPLY(), 1747n);
    assert.equal(await melting.read.MELTING_MAX_MINT_PER_TX(), 11n);
    assert.equal(await melting.read.MELTING_ROYALTY_FEE(), 1100n);
    assert.equal(await melting.read.mintPrice(), MELTING_MINT_PRICE);
    assert.equal(await melting.read.gatedMintEnabled(), false);

    assert.equal(
      sameAddress(await melting.read.stakingContract(), staking.address),
      true,
    );

    assert.equal(
      sameAddress(await melting.read.rotyCollection(), roty.address),
      true,
    );

    assert.equal(
      sameAddress(await melting.read.treasury(), treasury.account.address),
      true,
    );
  });

  it("owner can enable gated mint", async function () {
    const { melting } = await deployFixture();

    await melting.write.setGatedMintEnabled([true]);

    assert.equal(await melting.read.gatedMintEnabled(), true);
  });

  it("rejects mint when gated mint is closed even if user has valid ROTY stake", async function () {
    const fixture = await deployFixture();
    const { melting, user } = fixture;

    await prepareValidRotyStake(fixture);

    await assert.rejects(async () => {
      await melting.write.mint([1n], {
        account: user.account,
        value: MELTING_MINT_PRICE,
      });
    });
  });

  it("rejects mint if user has no ROTY NFT", async function () {
    const { melting, user } = await deployFixture();

    await melting.write.setGatedMintEnabled([true]);

    await assert.rejects(async () => {
      await melting.write.mint([1n], {
        account: user.account,
        value: MELTING_MINT_PRICE,
      });
    });
  });

  it("rejects mint if user holds ROTY but has not staked", async function () {
    const { roty, staking, melting, user } = await deployFixture();

    await roty.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([roty.address, true]);
    await melting.write.setGatedMintEnabled([true]);

    await assert.rejects(async () => {
      await melting.write.mint([1n], {
        account: user.account,
        value: MELTING_MINT_PRICE,
      });
    });
  });

  it("allows staking-gated paid mint with valid ROTY stake", async function () {
    const fixture = await deployFixture();
    const { melting, publicClient, treasury, user } = fixture;

    await prepareValidRotyStake(fixture);
    await melting.write.setGatedMintEnabled([true]);

    const treasuryBefore = await publicClient.getBalance({
      address: treasury.account.address,
    });

    await melting.write.mint([2n], {
      account: user.account,
      value: MELTING_MINT_PRICE * 2n,
    });

    const treasuryAfter = await publicClient.getBalance({
      address: treasury.account.address,
    });

    assert.equal(await melting.read.totalMinted(), 2n);
    assert.equal(
      sameAddress(await melting.read.ownerOf([1n]), user.account.address),
      true,
    );
    assert.equal(
      sameAddress(await melting.read.ownerOf([2n]), user.account.address),
      true,
    );
    assert.equal(treasuryAfter - treasuryBefore, MELTING_MINT_PRICE * 2n);
  });

  it("rejects mint if ROTY stake becomes invalid because NFT leaves wallet", async function () {
    const fixture = await deployFixture();
    const { roty, staking, melting, user, other } = fixture;

    await prepareValidRotyStake(fixture);
    await melting.write.setGatedMintEnabled([true]);

    assert.equal(
      await staking.read.hasValidStake([user.account.address, roty.address]),
      true,
    );

    await roty.write.transferFrom(
      [user.account.address, other.account.address, 1n],
      {
        account: user.account,
      },
    );

    assert.equal(
      await staking.read.hasValidStake([user.account.address, roty.address]),
      false,
    );

    await assert.rejects(async () => {
      await melting.write.mint([1n], {
        account: user.account,
        value: MELTING_MINT_PRICE,
      });
    });
  });

  it("allows mint again when ROTY returns to the staker wallet", async function () {
    const fixture = await deployFixture();
    const { roty, staking, melting, user, other } = fixture;

    await prepareValidRotyStake(fixture);
    await melting.write.setGatedMintEnabled([true]);

    await roty.write.transferFrom(
      [user.account.address, other.account.address, 1n],
      {
        account: user.account,
      },
    );

    await roty.write.transferFrom(
      [other.account.address, user.account.address, 1n],
      {
        account: other.account,
      },
    );

    assert.equal(
      await staking.read.hasValidStake([user.account.address, roty.address]),
      true,
    );

    await melting.write.mint([1n], {
      account: user.account,
      value: MELTING_MINT_PRICE,
    });

    assert.equal(await melting.read.totalMinted(), 1n);
  });

  it("requires exact payment", async function () {
    const fixture = await deployFixture();
    const { melting, user } = fixture;

    await prepareValidRotyStake(fixture);
    await melting.write.setGatedMintEnabled([true]);

    await assert.rejects(async () => {
      await melting.write.mint([1n], {
        account: user.account,
        value: MELTING_MINT_PRICE - 1n,
      });
    });

    await assert.rejects(async () => {
      await melting.write.mint([1n], {
        account: user.account,
        value: MELTING_MINT_PRICE + 1n,
      });
    });
  });
});
