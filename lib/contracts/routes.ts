import type { ChainSet } from "@/lib/chains/chainConfig";
import type { CollectionKey } from "./collectionConfig";

export function getMintRoute(collection: CollectionKey, chainSet: ChainSet) {
  return `/mint/${collection}/${chainSet}`;
}

export function getDashboardRoute(chainSet: ChainSet) {
  return `/dashboard/${chainSet}`;
}

export function getMintDomain(collection: CollectionKey, chainSet: ChainSet) {
  if (collection === "roty" && chainSet === "base") {
    return "https://rotybase.endhonesa.com/";
  }

  if (collection === "roty" && chainSet === "ethereum") {
    return "https://rotydeth.endhonesa.com/";
  }

  if (collection === "melting" && chainSet === "base") {
    return "https://meltingbase.endhonesa.com/";
  }

  if (collection === "melting" && chainSet === "ethereum") {
    return "https://meltingdeth.endhonesa.com/";
  }

  if (collection === "amanda" && chainSet === "base") {
    return "https://amandabase.endhonesa.com/";
  }

  return "https://amandadeth.endhonesa.com/";
}
