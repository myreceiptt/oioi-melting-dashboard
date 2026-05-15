import type { ChainSet } from "@/lib/chains/chainConfig";
import { getExplorerBaseUrl } from "@/lib/chains/chainConfig";

export function getAddressUrl(chainSet: ChainSet, address: string) {
  return `${getExplorerBaseUrl(chainSet)}/address/${address}`;
}

export function getTxUrl(chainSet: ChainSet, txHash: string) {
  return `${getExplorerBaseUrl(chainSet)}/tx/${txHash}`;
}

export function getTokenUrl(chainSet: ChainSet, address: string) {
  return `${getExplorerBaseUrl(chainSet)}/token/${address}`;
}
