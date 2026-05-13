import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress, parseEther, zeroHash, type Address } from "viem";

const NAME = "The ROTY BASE";
const SYMBOL = "ROTYBASE";
const MINT_PRICE = parseEther("0.001047");
const UNREVEALED_URI =
  "ipfs://bafkreiefsmbkjgw3fs47v52xu6zqzbgw4z2fhdsgvaczh7gstn4txurv2m";
const REVEALED_BASE_URI =
  "ipfs://bafybeigzgy6jngo4lvdqukwge2e3nwtgmnt7kpkmg7p2mmi2zrr5atmm3a/";
const ROYALTY_FEE = 1_100n;

function sameAddress(a: unknown, b: unknown) {
  assert.equal(typeof a, "string");
  assert.equal(typeof b, "string");

  return getAddress(a as Address) === getAddress(b as Address);
}

async function deployFixture() {
  const { viem } = await network.connect();

  const [owner, treasury, royaltyReceiver, whitelisted, publicUser, other] =
    await viem.getWalletClients();

  const leafContract = await viem.deployContract("TheRotyMemorial", [
    NAME,
    SYMBOL,
    MINT_PRICE,
    zeroHash,
    treasury.account.address,
    royaltyReceiver.account.address,
    UNREVEALED_URI,
    REVEALED_BASE_URI,
    owner.account.address,
  ]);

  const whitelistLeaf = (await leafContract.read.whitelistLeaf([
    whitelisted.account.address,
  ])) as `0x${string}`;

  const contract = await viem.deployContract("TheRotyMemorial", [
    NAME,
    SYMBOL,
    MINT_PRICE,
    whitelistLeaf,
    treasury.account.address,
    royaltyReceiver.account.address,
    UNREVEALED_URI,
    REVEALED_BASE_URI,
    owner.account.address,
  ]);

  const publicClient = await viem.getPublicClient();

  return {
    contract,
    publicClient,
    owner,
    treasury,
    royaltyReceiver,
    whitelisted,
    publicUser,
    other,
    whitelistProof: [] as `0x${string}`[],
    invalidProof: [] as `0x${string}`[],
    merkleRoot: whitelistLeaf,
  };
}

describe("TheRotyMemorial", function () {
  it("sets ROTY constants and constructor values", async function () {
    const { contract, treasury } = await deployFixture();

    assert.equal(await contract.read.name(), NAME);
    assert.equal(await contract.read.symbol(), SYMBOL);
    assert.equal(await contract.read.ROTY_MAX_SUPPLY(), 1047n);
    assert.equal(await contract.read.ROTY_MAX_MINT_PER_TX(), 11n);
    assert.equal(await contract.read.ROTY_ROYALTY_FEE(), ROYALTY_FEE);
    assert.equal(await contract.read.ORIGIN_CHAIN_ID(), 137n);
    assert.equal(
      sameAddress(
        await contract.read.ORIGIN_CONTRACT(),
        "0x6d2723cb02c558cf67473dc959ac08737b6129a9",
      ),
      true,
    );
    assert.equal(await contract.read.ORIGIN_NAME(), "THE ROTY BROI");
    assert.equal(
      sameAddress(await contract.read.treasury(), treasury.account.address),
      true,
    );
    assert.equal(await contract.read.mintPrice(), MINT_PRICE);
    assert.equal(await contract.read.whitelistMintEnabled(), false);
    assert.equal(await contract.read.publicMintEnabled(), false);
  });

  it("owner can update Merkle root and mint phase booleans", async function () {
    const { contract, merkleRoot } = await deployFixture();

    await contract.write.setMerkleRoot([merkleRoot]);
    await contract.write.setWhitelistMintEnabled([true]);
    await contract.write.setPublicMintEnabled([true]);

    assert.equal(await contract.read.merkleRoot(), merkleRoot);
    assert.equal(await contract.read.whitelistMintEnabled(), true);
    assert.equal(await contract.read.publicMintEnabled(), true);
  });

  it("rejects whitelist mint when whitelist phase is closed", async function () {
    const { contract, whitelisted, whitelistProof } = await deployFixture();

    await assert.rejects(async () => {
      await contract.write.whitelistMint([whitelistProof], {
        account: whitelisted.account,
      });
    });
  });

  it("allows a whitelisted wallet to free mint exactly once", async function () {
    const { contract, whitelisted, whitelistProof } = await deployFixture();

    await contract.write.setWhitelistMintEnabled([true]);

    await contract.write.whitelistMint([whitelistProof], {
      account: whitelisted.account,
    });

    assert.equal(await contract.read.totalMinted(), 1n);
    assert.equal(
      sameAddress(
        await contract.read.ownerOf([1n]),
        whitelisted.account.address,
      ),
      true,
    );
    assert.equal(
      await contract.read.whitelistClaimed([whitelisted.account.address]),
      true,
    );

    await assert.rejects(async () => {
      await contract.write.whitelistMint([whitelistProof], {
        account: whitelisted.account,
      });
    });
  });

  it("rejects non-whitelisted wallet", async function () {
    const { contract, publicUser, whitelistProof } = await deployFixture();

    await contract.write.setWhitelistMintEnabled([true]);

    await assert.rejects(async () => {
      await contract.write.whitelistMint([whitelistProof], {
        account: publicUser.account,
      });
    });
  });

  it("allows public paid mint when public phase is open", async function () {
    const { contract, publicClient, treasury, publicUser } =
      await deployFixture();

    await contract.write.setPublicMintEnabled([true]);

    const treasuryBefore = await publicClient.getBalance({
      address: treasury.account.address,
    });

    await contract.write.publicMint([2n], {
      account: publicUser.account,
      value: MINT_PRICE * 2n,
    });

    const treasuryAfter = await publicClient.getBalance({
      address: treasury.account.address,
    });

    assert.equal(await contract.read.totalMinted(), 2n);
    assert.equal(
      sameAddress(
        await contract.read.ownerOf([1n]),
        publicUser.account.address,
      ),
      true,
    );
    assert.equal(
      sameAddress(
        await contract.read.ownerOf([2n]),
        publicUser.account.address,
      ),
      true,
    );
    assert.equal(treasuryAfter - treasuryBefore, MINT_PRICE * 2n);
  });

  it("rejects public mint when public phase is closed", async function () {
    const { contract, publicUser } = await deployFixture();

    await assert.rejects(async () => {
      await contract.write.publicMint([1n], {
        account: publicUser.account,
        value: MINT_PRICE,
      });
    });
  });

  it("requires exact payment for public mint", async function () {
    const { contract, publicUser } = await deployFixture();

    await contract.write.setPublicMintEnabled([true]);

    await assert.rejects(async () => {
      await contract.write.publicMint([1n], {
        account: publicUser.account,
        value: MINT_PRICE - 1n,
      });
    });

    await assert.rejects(async () => {
      await contract.write.publicMint([1n], {
        account: publicUser.account,
        value: MINT_PRICE + 1n,
      });
    });
  });

  it("allows whitelist wallet to public mint after free mint", async function () {
    const { contract, whitelisted, whitelistProof } = await deployFixture();

    await contract.write.setWhitelistMintEnabled([true]);
    await contract.write.setPublicMintEnabled([true]);

    await contract.write.whitelistMint([whitelistProof], {
      account: whitelisted.account,
    });

    await contract.write.publicMint([2n], {
      account: whitelisted.account,
      value: MINT_PRICE * 2n,
    });

    assert.equal(await contract.read.totalMinted(), 3n);
    assert.equal(
      sameAddress(
        await contract.read.ownerOf([1n]),
        whitelisted.account.address,
      ),
      true,
    );
    assert.equal(
      sameAddress(
        await contract.read.ownerOf([2n]),
        whitelisted.account.address,
      ),
      true,
    );
    assert.equal(
      sameAddress(
        await contract.read.ownerOf([3n]),
        whitelisted.account.address,
      ),
      true,
    );
  });
});
