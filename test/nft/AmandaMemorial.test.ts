import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress, parseEther, type Address } from "viem";

const ROTY_NAME = "Mock ROTY";
const ROTY_SYMBOL = "ROTY";
const MELTING_NAME = "Mock Melting";
const MELTING_SYMBOL = "MELT";
const AMANDA_NAME = "Amanda BASE";
const AMANDA_SYMBOL = "AMANBASE";

const MOCK_MAX_SUPPLY = 20n;
const MOCK_MAX_MINT_PER_TX = 5n;
const MOCK_MINT_PRICE = parseEther("0.001");

const AMANDA_MINT_PRICE = parseEther("0.002020");

const UNREVEALED_URI = "ipfs://amanda-unrevealed";
const REVEALED_BASE_URI = "ipfs://amanda-revealed/";
const BASE_EXTENSION = ".json";
const ROYALTY_FEE = 1_100;

function sameAddress(a: unknown, b: unknown) {
  assert.equal(typeof a, "string");
  assert.equal(typeof b, "string");

  return getAddress(a as Address) === getAddress(b as Address);
}

async function deployFixture() {
  const { viem } = await network.connect();

  const [owner, treasury, royaltyReceiver, user, other, stranger] =
    await viem.getWalletClients();

  const roty = await viem.deployContract("MockMemorialNFTCore", [
    ROTY_NAME,
    ROTY_SYMBOL,
    MOCK_MAX_SUPPLY,
    MOCK_MAX_MINT_PER_TX,
    MOCK_MINT_PRICE,
    treasury.account.address,
    "ipfs://roty-unrevealed",
    "ipfs://roty-revealed/",
    BASE_EXTENSION,
    royaltyReceiver.account.address,
    ROYALTY_FEE,
    owner.account.address,
  ]);

  const melting = await viem.deployContract("MockMemorialNFTCore", [
    MELTING_NAME,
    MELTING_SYMBOL,
    MOCK_MAX_SUPPLY,
    MOCK_MAX_MINT_PER_TX,
    MOCK_MINT_PRICE,
    treasury.account.address,
    "ipfs://melting-unrevealed",
    "ipfs://melting-revealed/",
    BASE_EXTENSION,
    royaltyReceiver.account.address,
    ROYALTY_FEE,
    owner.account.address,
  ]);

  const staking = await viem.deployContract("OiOiSoftStaking", [
    owner.account.address,
  ]);

  const amanda = await viem.deployContract("AmandaMemorial", [
    AMANDA_NAME,
    AMANDA_SYMBOL,
    AMANDA_MINT_PRICE,
    staking.address,
    roty.address,
    melting.address,
    treasury.account.address,
    royaltyReceiver.account.address,
    UNREVEALED_URI,
    REVEALED_BASE_URI,
    owner.account.address,
  ]);

  const publicClient = await viem.getPublicClient();

  return {
    roty,
    melting,
    staking,
    amanda,
    publicClient,
    owner,
    treasury,
    royaltyReceiver,
    user,
    other,
    stranger,
  };
}

async function prepareValidStake(
  fixture: Awaited<ReturnType<typeof deployFixture>>,
  collection: "roty" | "melting",
) {
  const { roty, melting, staking, user } = fixture;
  const nft = collection === "roty" ? roty : melting;

  await nft.write.ownerMint([user.account.address, 1n]);
  await staking.write.setCollectionApproved([nft.address, true]);

  await staking.write.stake([nft.address, 1n], {
    account: user.account,
  });
}

describe("AmandaMemorial", function () {
  it("sets constructor values and dependencies", async function () {
    const { amanda, staking, roty, melting, treasury } = await deployFixture();

    assert.equal(await amanda.read.name(), AMANDA_NAME);
    assert.equal(await amanda.read.symbol(), AMANDA_SYMBOL);
    assert.equal(await amanda.read.AMANDA_MAX_SUPPLY(), 2020n);
    assert.equal(await amanda.read.AMANDA_MAX_MINT_PER_TX(), 11n);
    assert.equal(await amanda.read.AMANDA_ROYALTY_FEE(), 1100n);
    assert.equal(await amanda.read.mintPrice(), AMANDA_MINT_PRICE);
    assert.equal(await amanda.read.gatedMintEnabled(), false);

    assert.equal(
      sameAddress(await amanda.read.stakingContract(), staking.address),
      true,
    );

    assert.equal(
      sameAddress(await amanda.read.rotyCollection(), roty.address),
      true,
    );

    assert.equal(
      sameAddress(await amanda.read.meltingCollection(), melting.address),
      true,
    );

    assert.equal(
      sameAddress(await amanda.read.treasury(), treasury.account.address),
      true,
    );
  });

  it("owner can enable gated mint", async function () {
    const { amanda } = await deployFixture();

    await amanda.write.setGatedMintEnabled([true]);

    assert.equal(await amanda.read.gatedMintEnabled(), true);
  });

  it("rejects mint when gated mint is closed even if user has valid ROTY stake", async function () {
    const fixture = await deployFixture();
    const { amanda, user } = fixture;

    await prepareValidStake(fixture, "roty");

    await assert.rejects(async () => {
      await amanda.write.mint([1n], {
        account: user.account,
        value: AMANDA_MINT_PRICE,
      });
    });
  });

  it("rejects mint if user has no ROTY or Melting stake", async function () {
    const { amanda, user } = await deployFixture();

    await amanda.write.setGatedMintEnabled([true]);

    await assert.rejects(async () => {
      await amanda.write.mint([1n], {
        account: user.account,
        value: AMANDA_MINT_PRICE,
      });
    });
  });

  it("rejects mint if user only holds ROTY but has not staked", async function () {
    const { roty, staking, amanda, user } = await deployFixture();

    await roty.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([roty.address, true]);
    await amanda.write.setGatedMintEnabled([true]);

    await assert.rejects(async () => {
      await amanda.write.mint([1n], {
        account: user.account,
        value: AMANDA_MINT_PRICE,
      });
    });
  });

  it("rejects mint if user only holds Melting but has not staked", async function () {
    const { melting, staking, amanda, user } = await deployFixture();

    await melting.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([melting.address, true]);
    await amanda.write.setGatedMintEnabled([true]);

    await assert.rejects(async () => {
      await amanda.write.mint([1n], {
        account: user.account,
        value: AMANDA_MINT_PRICE,
      });
    });
  });

  it("allows staking-gated paid mint with valid ROTY stake", async function () {
    const fixture = await deployFixture();
    const { amanda, publicClient, treasury, user } = fixture;

    await prepareValidStake(fixture, "roty");
    await amanda.write.setGatedMintEnabled([true]);

    const treasuryBefore = await publicClient.getBalance({
      address: treasury.account.address,
    });

    await amanda.write.mint([2n], {
      account: user.account,
      value: AMANDA_MINT_PRICE * 2n,
    });

    const treasuryAfter = await publicClient.getBalance({
      address: treasury.account.address,
    });

    assert.equal(await amanda.read.totalMinted(), 2n);
    assert.equal(
      sameAddress(await amanda.read.ownerOf([1n]), user.account.address),
      true,
    );
    assert.equal(
      sameAddress(await amanda.read.ownerOf([2n]), user.account.address),
      true,
    );
    assert.equal(treasuryAfter - treasuryBefore, AMANDA_MINT_PRICE * 2n);
  });

  it("allows staking-gated paid mint with valid Melting stake", async function () {
    const fixture = await deployFixture();
    const { amanda, user } = fixture;

    await prepareValidStake(fixture, "melting");
    await amanda.write.setGatedMintEnabled([true]);

    await amanda.write.mint([1n], {
      account: user.account,
      value: AMANDA_MINT_PRICE,
    });

    assert.equal(await amanda.read.totalMinted(), 1n);
    assert.equal(
      sameAddress(await amanda.read.ownerOf([1n]), user.account.address),
      true,
    );
  });

  it("rejects mint if ROTY stake becomes invalid because NFT leaves wallet", async function () {
    const fixture = await deployFixture();
    const { roty, staking, amanda, user, other } = fixture;

    await prepareValidStake(fixture, "roty");
    await amanda.write.setGatedMintEnabled([true]);

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
      await amanda.write.mint([1n], {
        account: user.account,
        value: AMANDA_MINT_PRICE,
      });
    });
  });

  it("allows mint again when ROTY returns to the staker wallet", async function () {
    const fixture = await deployFixture();
    const { roty, staking, amanda, user, other } = fixture;

    await prepareValidStake(fixture, "roty");
    await amanda.write.setGatedMintEnabled([true]);

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

    await amanda.write.mint([1n], {
      account: user.account,
      value: AMANDA_MINT_PRICE,
    });

    assert.equal(await amanda.read.totalMinted(), 1n);
  });

  it("requires exact payment", async function () {
    const fixture = await deployFixture();
    const { amanda, user } = fixture;

    await prepareValidStake(fixture, "roty");
    await amanda.write.setGatedMintEnabled([true]);

    await assert.rejects(async () => {
      await amanda.write.mint([1n], {
        account: user.account,
        value: AMANDA_MINT_PRICE - 1n,
      });
    });

    await assert.rejects(async () => {
      await amanda.write.mint([1n], {
        account: user.account,
        value: AMANDA_MINT_PRICE + 1n,
      });
    });
  });
});
