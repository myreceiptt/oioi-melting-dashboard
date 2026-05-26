import { formatEther, formatUnits } from "viem";

export function formatEth(value: bigint | undefined) {
  if (value === undefined) {
    return "—";
  }

  const formatted = formatEther(value);

  return `${formatted} ETH`;
}

export function formatTokenAmount({
  value,
  symbol = "OiOi",
  decimals = 18,
}: {
  value: bigint | undefined;
  symbol?: string;
  decimals?: number;
}) {
  if (value === undefined) {
    return "—";
  }

  return `${formatUnits(value, decimals)} ${symbol}`;
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

export function shortMiddle(
  value: string | undefined,
  head = 9,
  tail = 4,
) {
  if (!value) {
    return "—";
  }

  if (value.length <= head + tail) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function formatBool(value: boolean | undefined) {
  if (value === undefined) {
    return "—";
  }

  return value ? "Yes" : "No";
}
