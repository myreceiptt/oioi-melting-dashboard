import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress, parseEther, type Address } from "viem";

const NAME = "Mock Memorial";
const SYMBOL = "MOCK";
const MAX_SUPPLY = 5n;
const MAX_MINT_PER_TX = 2n;
const MINT_PRICE = parseEther("0.01");
const UNREVEALED_URI = "ipfs://unrevealed";
const REVEALED_BASE_URI = "ipfs://revealed/";
const BASE_EXTENSION = ".json";
const ROYALTY_FEE = 1_100; // 11%

function sameAddress(a: unknown, b: unknown) {
  assert.equal(typeof a, "string");
  assert.equal(typeof b, "string");

  return getAddress(a as Address) === getAddress(b as Address);
}

async function deployFixture() {
  const { viem } = await network.connect();

  const [owner, treasury, royaltyReceiver, user, other] =
    await viem.getWalletClients();

  const contract = await viem.deployContract("MockMemorialNFTCore", [
    NAME,
    SYMBOL,
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

  const publicClient = await viem.getPublicClient();

  return {
    contract,
    publicClient,
    owner,
    treasury,
    royaltyReceiver,
    user,
    other,
  };
}

describe("MemorialNFTCore", function () {
  it("sets constructor values", async function () {
    const { contract, treasury } = await deployFixture();

    assert.equal(await contract.read.name(), NAME);
    assert.equal(await contract.read.symbol(), SYMBOL);
    assert.equal(await contract.read.maxSupply(), MAX_SUPPLY);
    assert.equal(await contract.read.maxMintPerTx(), MAX_MINT_PER_TX);
    assert.equal(await contract.read.mintPrice(), MINT_PRICE);
    assert.equal(
      sameAddress(await contract.read.treasury(), treasury.account.address),
      true,
    );
    assert.equal(await contract.read.unrevealedURI(), UNREVEALED_URI);
    assert.equal(await contract.read.revealedBaseURI(), REVEALED_BASE_URI);
    assert.equal(await contract.read.baseExtension(), BASE_EXTENSION);
    assert.equal(await contract.read.revealed(), false);
    assert.equal(await contract.read.metadataLocked(), false);
    assert.equal(await contract.read.totalMinted(), 0n);
  });

  it("owner can mint sequential tokens", async function () {
    const { contract, user } = await deployFixture();

    await contract.write.ownerMint([user.account.address, 2n]);

    assert.equal(await contract.read.totalMinted(), 2n);
    assert.equal(
      sameAddress(await contract.read.ownerOf([1n]), user.account.address),
      true,
    );

    assert.equal(
      sameAddress(await contract.read.ownerOf([2n]), user.account.address),
      true,
    );
    assert.equal(await contract.read.nextTokenId(), 3n);
    assert.equal(await contract.read.remainingSupply(), 3n);
  });

  it("returns unrevealed URI before reveal and token URI after reveal", async function () {
    const { contract, user } = await deployFixture();

    await contract.write.ownerMint([user.account.address, 1n]);

    assert.equal(await contract.read.tokenURI([1n]), UNREVEALED_URI);

    await contract.write.setRevealed([true]);

    assert.equal(
      await contract.read.tokenURI([1n]),
      `${REVEALED_BASE_URI}1${BASE_EXTENSION}`,
    );
  });

  it("locks metadata only after reveal", async function () {
    const { contract } = await deployFixture();

    await assert.rejects(async () => {
      await contract.write.lockMetadata();
    });

    await contract.write.setRevealed([true]);
    await contract.write.lockMetadata();

    assert.equal(await contract.read.metadataLocked(), true);

    await assert.rejects(async () => {
      await contract.write.setBaseExtension([".metadata.json"]);
    });
  });

  it("requires exact payment for paid mint and forwards ETH to treasury", async function () {
    const { contract, publicClient, treasury, user } = await deployFixture();

    const treasuryBefore = await publicClient.getBalance({
      address: treasury.account.address,
    });

    await contract.write.paidMint([2n], {
      account: user.account,
      value: MINT_PRICE * 2n,
    });

    const treasuryAfter = await publicClient.getBalance({
      address: treasury.account.address,
    });

    assert.equal(await contract.read.totalMinted(), 2n);
    assert.equal(treasuryAfter - treasuryBefore, MINT_PRICE * 2n);
  });

  it("rejects over maxMintPerTx", async function () {
    const { contract, user } = await deployFixture();

    await assert.rejects(async () => {
      await contract.write.ownerMint([user.account.address, 3n]);
    });
  });

  it("rejects mint beyond maxSupply", async function () {
    const { contract, user } = await deployFixture();

    await contract.write.ownerMint([user.account.address, 2n]);
    await contract.write.ownerMint([user.account.address, 2n]);

    await assert.rejects(async () => {
      await contract.write.ownerMint([user.account.address, 2n]);
    });
  });

  it("reports ERC2981 royalty info", async function () {
    const { contract, royaltyReceiver, user } = await deployFixture();

    await contract.write.ownerMint([user.account.address, 1n]);

    const salePrice = parseEther("1");
    const royaltyInfo = (await contract.read.royaltyInfo([
      1n,
      salePrice,
    ])) as readonly [Address, bigint];

    const [receiver, royaltyAmount] = royaltyInfo;

    assert.equal(sameAddress(receiver, royaltyReceiver.account.address), true);
    assert.equal(royaltyAmount, parseEther("0.11"));
  });

  it("only owner can update owner-controlled settings", async function () {
    const { contract, user } = await deployFixture();

    await assert.rejects(async () => {
      await contract.write.setMintPrice([parseEther("0.02")], {
        account: user.account,
      });
    });

    await contract.write.setMintPrice([parseEther("0.02")]);

    assert.equal(await contract.read.mintPrice(), parseEther("0.02"));
  });
});
