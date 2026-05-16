import { formatEther } from "viem";

export function formatEth(value: bigint | undefined) {
  if (value === undefined) {
    return "—";
  }

  const formatted = formatEther(value);

  return `${formatted} ETH`;
}

export function formatNumber(value: bigint | number | undefined) {
  if (value === undefined) {
    return "—";
  }

  return value.toString();
}

export function shortAddress(address: string | undefined) {
  if (!address) {
    return "—";
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatBool(value: boolean | undefined) {
  if (value === undefined) {
    return "—";
  }

  return value ? "Yes" : "No";
}
