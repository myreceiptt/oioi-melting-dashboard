import type { RewardAllocation, RewardRoundInput } from "./types";

function main() {
  console.log("TODO: calculate reward round allocations.");

  const exampleInput: RewardRoundInput = {
    chain: "base",
    roundId: 1,
    periodStartTimestamp: 0,
    periodEndTimestamp: 0,
    rewardAmountWei: "0",
    stakingContract: "0x0000000000000000000000000000000000000000",
    rewardDistributor: "0x0000000000000000000000000000000000000000",
    collections: [],
  };

  const allocations: RewardAllocation[] = [];

  console.log({ exampleInput, allocations });
}

main();
