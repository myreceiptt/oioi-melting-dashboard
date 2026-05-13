import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress, parseEther, type Address } from "viem";

const NFT_NAME = "Mock Memorial";
const NFT_SYMBOL = "MOCK";
const MAX_SUPPLY = 10n;
const MAX_MINT_PER_TX = 5n;
const MINT_PRICE = parseEther("0.01");
const UNREVEALED_URI = "ipfs://unrevealed";
const REVEALED_BASE_URI = "ipfs://revealed/";
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

  const nft = await viem.deployContract("MockMemorialNFTCore", [
    NFT_NAME,
    NFT_SYMBOL,
    MAX_SUPPLY,
    MAX_MINT_PER_TX,
    MINT_PRICE,
    treasury.account.address,
    UNREVEALED_URI,
    REVEALED_BASE_URI,
    BASE_EXTENSION,
    royaltyReceiver.account.address,
    ROYALTY_FEE,
    owner.account.address,
  ]);

  const staking = await viem.deployContract("OiOiSoftStaking", [
    owner.account.address,
  ]);

  return {
    nft,
    staking,
    owner,
    treasury,
    royaltyReceiver,
    user,
    other,
    stranger,
  };
}

describe("OiOiSoftStaking", function () {
  it("sets initial owner and build stage", async function () {
    const { staking, owner } = await deployFixture();

    assert.equal(await staking.read.BUILD_STAGE(), "SOFT_STAKING_V1");
    assert.equal(
      sameAddress(await staking.read.owner(), owner.account.address),
      true,
    );
  });

  it("owner can approve and unapprove a collection", async function () {
    const { staking, nft } = await deployFixture();

    assert.equal(await staking.read.approvedCollection([nft.address]), false);

    await staking.write.setCollectionApproved([nft.address, true]);

    assert.equal(await staking.read.approvedCollection([nft.address]), true);

    await staking.write.setCollectionApproved([nft.address, false]);

    assert.equal(await staking.read.approvedCollection([nft.address]), false);
  });

  it("rejects staking an unapproved collection", async function () {
    const { nft, staking, user } = await deployFixture();

    await nft.write.ownerMint([user.account.address, 1n]);

    await assert.rejects(async () => {
      await staking.write.stake([nft.address, 1n], {
        account: user.account,
      });
    });
  });

  it("rejects staking if caller is not token owner", async function () {
    const { nft, staking, user, stranger } = await deployFixture();

    await nft.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([nft.address, true]);

    await assert.rejects(async () => {
      await staking.write.stake([nft.address, 1n], {
        account: stranger.account,
      });
    });
  });

  it("allows owner to soft stake an approved NFT", async function () {
    const { nft, staking, user } = await deployFixture();

    await nft.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([nft.address, true]);

    await staking.write.stake([nft.address, 1n], {
      account: user.account,
    });

    const position = (await staking.read.getStakePosition([
      user.account.address,
      nft.address,
      1n,
    ])) as {
      exists: boolean;
      active: boolean;
      stakedAt: number;
      unstakedAt: number;
    };

    assert.equal(position.exists, true);
    assert.equal(position.active, true);
    assert.equal(
      await staking.read.isStakeActive([user.account.address, nft.address, 1n]),
      true,
    );
    assert.equal(
      await staking.read.isStakeValid([user.account.address, nft.address, 1n]),
      true,
    );
    assert.equal(
      await staking.read.hasValidStake([user.account.address, nft.address]),
      true,
    );

    const tokenIds = (await staking.read.getUserStakedTokenIds([
      user.account.address,
      nft.address,
    ])) as readonly bigint[];

    assert.deepEqual(tokenIds, [1n]);
  });

  it("rejects duplicate active stake by the same user", async function () {
    const { nft, staking, user } = await deployFixture();

    await nft.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([nft.address, true]);

    await staking.write.stake([nft.address, 1n], {
      account: user.account,
    });

    await assert.rejects(async () => {
      await staking.write.stake([nft.address, 1n], {
        account: user.account,
      });
    });
  });

  it("valid stake becomes false when NFT leaves wallet and true again when returned", async function () {
    const { nft, staking, user, other } = await deployFixture();

    await nft.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([nft.address, true]);

    await staking.write.stake([nft.address, 1n], {
      account: user.account,
    });

    assert.equal(
      await staking.read.hasValidStake([user.account.address, nft.address]),
      true,
    );

    await nft.write.transferFrom(
      [user.account.address, other.account.address, 1n],
      {
        account: user.account,
      },
    );

    assert.equal(
      await staking.read.hasValidStake([user.account.address, nft.address]),
      false,
    );
    assert.equal(
      await staking.read.isStakeActive([user.account.address, nft.address, 1n]),
      true,
    );
    assert.equal(
      await staking.read.isStakeValid([user.account.address, nft.address, 1n]),
      false,
    );

    await nft.write.transferFrom(
      [other.account.address, user.account.address, 1n],
      {
        account: other.account,
      },
    );

    assert.equal(
      await staking.read.hasValidStake([user.account.address, nft.address]),
      true,
    );
    assert.equal(
      await staking.read.isStakeValid([user.account.address, nft.address, 1n]),
      true,
    );
  });

  it("allows staker to unstake even if NFT is no longer in wallet", async function () {
    const { nft, staking, user, other } = await deployFixture();

    await nft.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([nft.address, true]);

    await staking.write.stake([nft.address, 1n], {
      account: user.account,
    });

    await nft.write.transferFrom(
      [user.account.address, other.account.address, 1n],
      {
        account: user.account,
      },
    );

    assert.equal(
      await staking.read.isStakeValid([user.account.address, nft.address, 1n]),
      false,
    );

    await staking.write.unstake([nft.address, 1n], {
      account: user.account,
    });

    assert.equal(
      await staking.read.isStakeActive([user.account.address, nft.address, 1n]),
      false,
    );
    assert.equal(
      await staking.read.hasValidStake([user.account.address, nft.address]),
      false,
    );
  });

  it("supports checking valid stake across multiple collections", async function () {
    const { nft, staking, user } = await deployFixture();

    await nft.write.ownerMint([user.account.address, 1n]);
    await staking.write.setCollectionApproved([nft.address, true]);

    await staking.write.stake([nft.address, 1n], {
      account: user.account,
    });

    const randomCollection = "0x0000000000000000000000000000000000000001";

    assert.equal(
      await staking.read.hasValidStakeInCollections([
        user.account.address,
        [randomCollection, nft.address],
      ]),
      true,
    );
  });
});
