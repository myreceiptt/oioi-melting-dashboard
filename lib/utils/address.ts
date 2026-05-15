import { getAddress, isAddress, type Address } from "viem";

export function parseAddress(label: string, value: string): Address {
  if (!isAddress(value)) {
    throw new Error(`${label} is not a valid address: ${value}`);
  }

  return getAddress(value);
}

export function sameAddress(a: string, b: string) {
  return getAddress(a) === getAddress(b);
}
