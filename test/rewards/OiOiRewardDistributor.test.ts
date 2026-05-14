import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress, parseEther, zeroHash, type Address } from "viem";

const TOKEN_NAME = "OiOi Token";
const TOKEN_SYMBOL = "OiOi";
const INITIAL_SUPPLY = parseEther("1000000");

const ROUND_ID = 1n;
const PERIOD_START = 1_700_000_000n;
const PERIOD_END = 1_700_086_400n;
const REWARD_AMOUNT = parseEther("11");
const USER_CLAIM_AMOUNT = parseEther("3");

function sameAddress(a: unknown, b: unknown) {
  assert.equal(typeof a, "string");
  assert.equal(typeof b, "string");

  return getAddress(a as Address) === getAddress(b as Address);
}

async function deployFixture() {
  const { viem } = await network.connect();

  const [owner, user, other, rescueRecipient] = await viem.getWalletClients();

  const token = await viem.deployContract("MockERC20", [
    TOKEN_NAME,
    TOKEN_SYMBOL,
    owner.account.address,
    INITIAL_SUPPLY,
  ]);

  const distributor = await viem.deployContract("OiOiRewardDistributor", [
    token.address,
    owner.account.address,
  ]);

  return {
    token,
    distributor,
    owner,
    user,
    other,
    rescueRecipient,
  };
}

async function createFundedSingleUserRound(
  fixture: Awaited<ReturnType<typeof deployFixture>>,
  roundId = ROUND_ID,
  userAmount = USER_CLAIM_AMOUNT,
  rewardAmount = REWARD_AMOUNT,
) {
  const { token, distributor, owner, user } = fixture;

  const leaf = (await distributor.read.rewardLeaf([
    roundId,
    user.account.address,
    userAmount,
  ])) as `0x${string}`;

  await distributor.write.createRewardRound([
    roundId,
    PERIOD_START,
    PERIOD_END,
    rewardAmount,
    leaf,
  ]);

  await token.write.approve([distributor.address, rewardAmount], {
    account: owner.account,
  });

  await distributor.write.fundRewardRound([roundId, rewardAmount]);

  return {
    merkleRoot: leaf,
    proof: [] as `0x${string}`[],
  };
}

describe("OiOiRewardDistributor", function () {
  it("sets immutable reward token and owner", async function () {
    const { token, distributor, owner } = await deployFixture();

    assert.equal(await distributor.read.BUILD_STAGE(), "REWARD_DISTRIBUTOR_V1");
    assert.equal(
      sameAddress(await distributor.read.rewardToken(), token.address),
      true,
    );
    assert.equal(
      sameAddress(await distributor.read.owner(), owner.account.address),
      true,
    );
  });

  it("creates reward round", async function () {
    const { distributor } = await deployFixture();

    await distributor.write.createRewardRound([
      ROUND_ID,
      PERIOD_START,
      PERIOD_END,
      REWARD_AMOUNT,
      zeroHash,
    ]);

    const round = (await distributor.read.getRewardRound([
      ROUND_ID,
    ])) as unknown as {
      exists: boolean;
      claimPaused: boolean;
      periodStart: bigint;
      periodEnd: bigint;
      rewardAmount: bigint;
      fundedAmount: bigint;
      claimedAmount: bigint;
      merkleRoot: `0x${string}`;
    };

    assert.equal(round.exists, true);
    assert.equal(round.claimPaused, false);
    assert.equal(round.periodStart, PERIOD_START);
    assert.equal(round.periodEnd, PERIOD_END);
    assert.equal(round.rewardAmount, REWARD_AMOUNT);
    assert.equal(round.fundedAmount, 0n);
    assert.equal(round.claimedAmount, 0n);
    assert.equal(round.merkleRoot, zeroHash);
  });

  it("rejects invalid reward round period and amount", async function () {
    const { distributor } = await deployFixture();

    await assert.rejects(async () => {
      await distributor.write.createRewardRound([
        ROUND_ID,
        PERIOD_END,
        PERIOD_START,
        REWARD_AMOUNT,
        zeroHash,
      ]);
    });

    await assert.rejects(async () => {
      await distributor.write.createRewardRound([
        ROUND_ID,
        PERIOD_START,
        PERIOD_END,
        0n,
        zeroHash,
      ]);
    });
  });

  it("funds reward round with approved reward token", async function () {
    const { token, distributor, owner } = await deployFixture();

    await distributor.write.createRewardRound([
      ROUND_ID,
      PERIOD_START,
      PERIOD_END,
      REWARD_AMOUNT,
      zeroHash,
    ]);

    await token.write.approve([distributor.address, REWARD_AMOUNT], {
      account: owner.account,
    });

    await distributor.write.fundRewardRound([ROUND_ID, REWARD_AMOUNT]);

    const round = (await distributor.read.getRewardRound([
      ROUND_ID,
    ])) as unknown as {
      fundedAmount: bigint;
    };

    assert.equal(round.fundedAmount, REWARD_AMOUNT);
    assert.equal(await distributor.read.totalRewardFunded(), REWARD_AMOUNT);
    assert.equal(
      await token.read.balanceOf([distributor.address]),
      REWARD_AMOUNT,
    );
    assert.equal(await distributor.read.isRoundFunded([ROUND_ID]), true);
  });

  it("rejects funding beyond reward amount", async function () {
    const { token, distributor, owner } = await deployFixture();

    await distributor.write.createRewardRound([
      ROUND_ID,
      PERIOD_START,
      PERIOD_END,
      REWARD_AMOUNT,
      zeroHash,
    ]);

    await token.write.approve([distributor.address, REWARD_AMOUNT + 1n], {
      account: owner.account,
    });

    await assert.rejects(async () => {
      await distributor.write.fundRewardRound([ROUND_ID, REWARD_AMOUNT + 1n]);
    });
  });

  it("allows valid claim and prevents double claim", async function () {
    const fixture = await deployFixture();
    const { token, distributor, user } = fixture;

    const { proof } = await createFundedSingleUserRound(fixture);

    const userBefore = (await token.read.balanceOf([
      user.account.address,
    ])) as bigint;

    await distributor.write.claim([ROUND_ID, USER_CLAIM_AMOUNT, proof], {
      account: user.account,
    });

    const userAfter = (await token.read.balanceOf([
      user.account.address,
    ])) as bigint;

    assert.equal(userAfter - userBefore, USER_CLAIM_AMOUNT);
    assert.equal(
      await distributor.read.hasClaimed([ROUND_ID, user.account.address]),
      true,
    );
    assert.equal(
      await distributor.read.totalRewardClaimed(),
      USER_CLAIM_AMOUNT,
    );

    await assert.rejects(async () => {
      await distributor.write.claim([ROUND_ID, USER_CLAIM_AMOUNT, proof], {
        account: user.account,
      });
    });
  });

  it("rejects invalid proof", async function () {
    const fixture = await deployFixture();
    const { distributor, other } = fixture;

    const { proof } = await createFundedSingleUserRound(fixture);

    await assert.rejects(async () => {
      await distributor.write.claim([ROUND_ID, USER_CLAIM_AMOUNT, proof], {
        account: other.account,
      });
    });
  });

  it("rejects claim before round is fully funded", async function () {
    const { token, distributor, owner, user } = await deployFixture();

    const leaf = (await distributor.read.rewardLeaf([
      ROUND_ID,
      user.account.address,
      USER_CLAIM_AMOUNT,
    ])) as `0x${string}`;

    await distributor.write.createRewardRound([
      ROUND_ID,
      PERIOD_START,
      PERIOD_END,
      REWARD_AMOUNT,
      leaf,
    ]);

    await token.write.approve([distributor.address, REWARD_AMOUNT - 1n], {
      account: owner.account,
    });

    await distributor.write.fundRewardRound([ROUND_ID, REWARD_AMOUNT - 1n]);

    await assert.rejects(async () => {
      await distributor.write.claim([ROUND_ID, USER_CLAIM_AMOUNT, []], {
        account: user.account,
      });
    });
  });

  it("allows owner to pause and unpause claims per round", async function () {
    const fixture = await deployFixture();
    const { distributor, user } = fixture;

    const { proof } = await createFundedSingleUserRound(fixture);

    await distributor.write.setClaimPaused([ROUND_ID, true]);

    await assert.rejects(async () => {
      await distributor.write.claim([ROUND_ID, USER_CLAIM_AMOUNT, proof], {
        account: user.account,
      });
    });

    await distributor.write.setClaimPaused([ROUND_ID, false]);

    await distributor.write.claim([ROUND_ID, USER_CLAIM_AMOUNT, proof], {
      account: user.account,
    });

    assert.equal(
      await distributor.read.hasClaimed([ROUND_ID, user.account.address]),
      true,
    );
  });

  it("allows owner to update Merkle root before claims but not after claims", async function () {
    const fixture = await deployFixture();
    const { distributor, user } = fixture;

    const { proof } = await createFundedSingleUserRound(fixture);

    const newRoot = (await distributor.read.rewardLeaf([
      ROUND_ID,
      user.account.address,
      USER_CLAIM_AMOUNT + 1n,
    ])) as `0x${string}`;

    await distributor.write.setMerkleRoot([ROUND_ID, newRoot]);

    const roundAfterUpdate = (await distributor.read.getRewardRound([
      ROUND_ID,
    ])) as unknown as {
      merkleRoot: `0x${string}`;
    };

    assert.equal(roundAfterUpdate.merkleRoot, newRoot);

    await distributor.write.setMerkleRoot([
      ROUND_ID,
      (await distributor.read.rewardLeaf([
        ROUND_ID,
        user.account.address,
        USER_CLAIM_AMOUNT,
      ])) as `0x${string}`,
    ]);

    await distributor.write.claim([ROUND_ID, USER_CLAIM_AMOUNT, proof], {
      account: user.account,
    });

    await assert.rejects(async () => {
      await distributor.write.setMerkleRoot([ROUND_ID, newRoot]);
    });
  });

  it("supports batchClaim across multiple rounds", async function () {
    const fixture = await deployFixture();
    const { token, distributor, owner, user } = fixture;

    const roundOneId = 1n;
    const roundTwoId = 2n;
    const amountOne = parseEther("1");
    const amountTwo = parseEther("2");

    const rootOne = (await distributor.read.rewardLeaf([
      roundOneId,
      user.account.address,
      amountOne,
    ])) as `0x${string}`;

    const rootTwo = (await distributor.read.rewardLeaf([
      roundTwoId,
      user.account.address,
      amountTwo,
    ])) as `0x${string}`;

    await distributor.write.createRewardRound([
      roundOneId,
      PERIOD_START,
      PERIOD_END,
      amountOne,
      rootOne,
    ]);

    await distributor.write.createRewardRound([
      roundTwoId,
      PERIOD_END + 1n,
      PERIOD_END + 1000n,
      amountTwo,
      rootTwo,
    ]);

    await token.write.approve([distributor.address, amountOne + amountTwo], {
      account: owner.account,
    });

    await distributor.write.fundRewardRound([roundOneId, amountOne]);
    await distributor.write.fundRewardRound([roundTwoId, amountTwo]);

    const before = (await token.read.balanceOf([
      user.account.address,
    ])) as bigint;

    await distributor.write.batchClaim(
      [
        [roundOneId, roundTwoId],
        [amountOne, amountTwo],
        [[], []],
      ],
      {
        account: user.account,
      },
    );

    const after = (await token.read.balanceOf([
      user.account.address,
    ])) as bigint;

    assert.equal(after - before, amountOne + amountTwo);
    assert.equal(
      await distributor.read.hasClaimed([roundOneId, user.account.address]),
      true,
    );
    assert.equal(
      await distributor.read.hasClaimed([roundTwoId, user.account.address]),
      true,
    );
  });

  it("does not allow owner to rescue allocated reward funds", async function () {
    const fixture = await deployFixture();
    const { distributor, rescueRecipient } = fixture;

    await createFundedSingleUserRound(fixture);

    await assert.rejects(async () => {
      await distributor.write.rescueERC20([
        (await distributor.read.rewardToken()) as `0x${string}`,
        rescueRecipient.account.address,
        1n,
      ]);
    });
  });

  it("allows owner to rescue excess reward token balance", async function () {
    const fixture = await deployFixture();
    const { token, distributor, rescueRecipient } = fixture;

    await createFundedSingleUserRound(fixture);

    await token.write.transfer([distributor.address, parseEther("5")]);

    assert.equal(
      await distributor.read.excessRewardTokenBalance(),
      parseEther("5"),
    );

    await distributor.write.rescueERC20([
      token.address,
      rescueRecipient.account.address,
      parseEther("5"),
    ]);

    assert.equal(
      await token.read.balanceOf([rescueRecipient.account.address]),
      parseEther("5"),
    );
  });
});
