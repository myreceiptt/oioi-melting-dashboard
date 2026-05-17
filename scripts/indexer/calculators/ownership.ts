import { getAddress } from "viem";
import type { CurrentOwnerRecord, TransferRecord } from "../types.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function ownerKey(transfer: TransferRecord) {
  return [
    transfer.chainId,
    transfer.collectionAddress.toLowerCase(),
    transfer.tokenId,
  ].join(":");
}

export function buildCurrentOwners(transfers: TransferRecord[]) {
  const sorted = [...transfers].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber - b.blockNumber;
    }

    return a.logIndex - b.logIndex;
  });

  const owners = new Map<string, CurrentOwnerRecord>();

  for (const transfer of sorted) {
    const key = ownerKey(transfer);

    if (transfer.to.toLowerCase() === ZERO_ADDRESS) {
      owners.delete(key);
      continue;
    }

    owners.set(key, {
      chainId: transfer.chainId,
      network: transfer.network,
      collectionKey: transfer.collectionKey,
      collectionAddress: getAddress(transfer.collectionAddress),
      tokenId: transfer.tokenId,
      owner: getAddress(transfer.to),
      updatedBlockNumber: transfer.blockNumber,
      updatedBlockTimestamp: transfer.blockTimestamp,
    });
  }

  return [...owners.values()].sort((a, b) => {
    if (a.collectionKey !== b.collectionKey) {
      return a.collectionKey.localeCompare(b.collectionKey);
    }

    return BigInt(a.tokenId) < BigInt(b.tokenId) ? -1 : 1;
  });
}
