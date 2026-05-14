import "dotenv/config";
import { getAddress, parseEther, zeroAddress, type Address } from "viem";

export type DeployNetworkKey =
  | "baseSepolia"
  | "ethereumSepolia"
  | "baseMainnet"
  | "ethereumMainnet";

export type CollectionKey = "roty" | "melting" | "amanda";

export type CollectionDeployConfig = {
  key: CollectionKey;
  contractName: "TheRotyMemorial" | "MeltingMemorial" | "AmandaMemorial";
  name: string;
  symbol: string;
  maxSupply: number;
  mintPriceWei: bigint;
  unrevealedURI: string;
  revealedBaseURI: string;
  mintPageUrl: string;
};

export type NetworkDeployConfig = {
  key: DeployNetworkKey;
  chainId: number;
  label: string;
  deploymentOutputDir: string;
  explorerName: string;
  explorerUrl: string;
  originUrl: string;
  dashboardUrl: string;
  oioiTokenAddress: Address;
  collections: {
    roty: CollectionDeployConfig;
    melting: CollectionDeployConfig;
    amanda: CollectionDeployConfig;
  };
};

export const DEPLOYER_ADDRESS = normalizeAddress(
  process.env.DEPLOYER_ADDRESS ||
    "0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0",
);

export const MINT_TREASURY_ADDRESS = normalizeAddress(
  process.env.MINT_TREASURY_ADDRESS ||
    "0x9e26b98d4fadf70d0c0e57c609347358934a934c",
);

export const ROYALTY_RECEIVER_ADDRESS = normalizeAddress(
  process.env.ROYALTY_RECEIVER_ADDRESS ||
    "0x29bf68e3969e0b6686ea55b7c48241ba3f6b9ba0",
);

export const ROYALTY_FEE_NUMERATOR = 1_100;
export const MAX_MINT_PER_TX = 11;

export const COLLECTION_WEIGHT_DENOMINATOR = 1_000_000;

export const COLLECTION_WEIGHTS = {
  roty: 217_491,
  melting: 362_900,
  amanda: 419_609,
} as const;

export const ROTY_ORIGIN = {
  originChainId: 137,
  originContract: normalizeAddress(
    "0x6d2723cb02c558cf67473dc959ac08737b6129a9",
  ),
  originName: "THE ROTY BROI",
} as const;

export const SHARED_URIS = {
  rotyUnrevealed:
    "ipfs://bafkreiefsmbkjgw3fs47v52xu6zqzbgw4z2fhdsgvaczh7gstn4txurv2m",
  rotyRevealedBase:
    "ipfs://bafybeigzgy6jngo4lvdqukwge2e3nwtgmnt7kpkmg7p2mmi2zrr5atmm3a/",
  meltingUnrevealed:
    "ipfs://bafkreiccvibarcxlaq3q2vm23p4jsbtxizkjneivjokh4srdpsi36zzzdi",
  // Pending final artwork. This can be updated on-chain before lockMetadata().
  meltingRevealedBase: "ipfs://pending-melting-revealed/",
  amandaUnrevealed:
    "ipfs://bafkreihvdfz5un5mslexhs2u5zagfw2dsw62hnvt3unvaypiijtyco7agy",
  // Pending final artwork. This can be updated on-chain before lockMetadata().
  amandaRevealedBase: "ipfs://pending-amanda-revealed/",
} as const;

export const DOMAINS = {
  rotyBroiOrigin:
    process.env.NEXT_PUBLIC_ROTY_BROI_ORIGIN_URL ||
    "https://rotybroi.endhonesa.com/",
  rotyBase:
    process.env.NEXT_PUBLIC_ROTY_BASE_URL ||
    "https://rotybase.endhonesa.com/",
  rotyDETH:
    process.env.NEXT_PUBLIC_ROTY_DETH_URL ||
    "https://rotydeth.endhonesa.com/",
  meltingBase:
    process.env.NEXT_PUBLIC_MELTING_BASE_URL ||
    "https://meltingbase.endhonesa.com/",
  meltingDETH:
    process.env.NEXT_PUBLIC_MELTING_DETH_URL ||
    "https://meltingdeth.endhonesa.com/",
  amandaBase:
    process.env.NEXT_PUBLIC_AMANDA_BASE_URL ||
    "https://amandabase.endhonesa.com/",
  amandaDETH:
    process.env.NEXT_PUBLIC_AMANDA_DETH_URL ||
    "https://amandadeth.endhonesa.com/",
  dashboard:
    process.env.NEXT_PUBLIC_SOFTSTAKING_URL ||
    "https://softstaking.endhonesa.com/",
} as const;

export const MAINNET_OIOI = {
  base: normalizeAddress("0xba0032620d88D9b16752CbDE75593c080C3d38de"),
  ethereum: normalizeAddress("0x1C696882b93d7241d09D55f52693cAD367A5bEaf"),
} as const;

export function getDeployConfig(networkName: string): NetworkDeployConfig {
  switch (networkName) {
    case "baseSepolia":
      return buildBaseConfig({
        key: "baseSepolia",
        chainId: 84532,
        label: "Base Sepolia",
        deploymentOutputDir: "deployments/base-sepolia",
        explorerName: "BaseScan Sepolia",
        explorerUrl: "https://sepolia.basescan.org",
        oioiTokenAddress: getOptionalAddressEnv("BASE_SEPOLIA_OIOI_TOKEN"),
      });

    case "baseMainnet":
      return buildBaseConfig({
        key: "baseMainnet",
        chainId: 8453,
        label: "Base Mainnet",
        deploymentOutputDir: "deployments/base-mainnet",
        explorerName: "BaseScan",
        explorerUrl: "https://basescan.org",
        oioiTokenAddress: MAINNET_OIOI.base,
      });

    case "ethereumSepolia":
      return buildEthereumConfig({
        key: "ethereumSepolia",
        chainId: 11155111,
        label: "Ethereum Sepolia",
        deploymentOutputDir: "deployments/ethereum-sepolia",
        explorerName: "Etherscan Sepolia",
        explorerUrl: "https://sepolia.etherscan.io",
        oioiTokenAddress: getOptionalAddressEnv("ETHEREUM_SEPOLIA_OIOI_TOKEN"),
      });

    case "ethereumMainnet":
      return buildEthereumConfig({
        key: "ethereumMainnet",
        chainId: 1,
        label: "Ethereum Mainnet",
        deploymentOutputDir: "deployments/ethereum-mainnet",
        explorerName: "Etherscan",
        explorerUrl: "https://etherscan.io",
        oioiTokenAddress: MAINNET_OIOI.ethereum,
      });

    default:
      throw new Error(
        `Unsupported deploy network "${networkName}". Expected baseSepolia, baseMainnet, ethereumSepolia, or ethereumMainnet.`,
      );
  }
}

function buildBaseConfig(args: {
  key: DeployNetworkKey;
  chainId: number;
  label: string;
  deploymentOutputDir: string;
  explorerName: string;
  explorerUrl: string;
  oioiTokenAddress: Address;
}): NetworkDeployConfig {
  return {
    ...args,
    originUrl: DOMAINS.rotyBroiOrigin,
    dashboardUrl: DOMAINS.dashboard,
    collections: {
      roty: {
        key: "roty",
        contractName: "TheRotyMemorial",
        name: "The ROTY BASE",
        symbol: "ROTYBASE",
        maxSupply: 1047,
        mintPriceWei: parseEther("0.001047"),
        unrevealedURI: SHARED_URIS.rotyUnrevealed,
        revealedBaseURI: SHARED_URIS.rotyRevealedBase,
        mintPageUrl: DOMAINS.rotyBase,
      },
      melting: {
        key: "melting",
        contractName: "MeltingMemorial",
        name: "Melting BASE",
        symbol: "MELTBASE",
        maxSupply: 1747,
        mintPriceWei: parseEther("0.001747"),
        unrevealedURI: SHARED_URIS.meltingUnrevealed,
        revealedBaseURI: SHARED_URIS.meltingRevealedBase,
        mintPageUrl: DOMAINS.meltingBase,
      },
      amanda: {
        key: "amanda",
        contractName: "AmandaMemorial",
        name: "Amanda BASE",
        symbol: "AMANBASE",
        maxSupply: 2020,
        mintPriceWei: parseEther("0.002020"),
        unrevealedURI: SHARED_URIS.amandaUnrevealed,
        revealedBaseURI: SHARED_URIS.amandaRevealedBase,
        mintPageUrl: DOMAINS.amandaBase,
      },
    },
  };
}

function buildEthereumConfig(args: {
  key: DeployNetworkKey;
  chainId: number;
  label: string;
  deploymentOutputDir: string;
  explorerName: string;
  explorerUrl: string;
  oioiTokenAddress: Address;
}): NetworkDeployConfig {
  return {
    ...args,
    originUrl: DOMAINS.rotyBroiOrigin,
    dashboardUrl: DOMAINS.dashboard,
    collections: {
      roty: {
        key: "roty",
        contractName: "TheRotyMemorial",
        name: "The ROTY dETH",
        symbol: "ROTYDETH",
        maxSupply: 1047,
        mintPriceWei: parseEther("0.01047"),
        unrevealedURI: SHARED_URIS.rotyUnrevealed,
        revealedBaseURI: SHARED_URIS.rotyRevealedBase,
        mintPageUrl: DOMAINS.rotyDETH,
      },
      melting: {
        key: "melting",
        contractName: "MeltingMemorial",
        name: "MELTING dETH",
        symbol: "MELTDETH",
        maxSupply: 1747,
        mintPriceWei: parseEther("0.01747"),
        unrevealedURI: SHARED_URIS.meltingUnrevealed,
        revealedBaseURI: SHARED_URIS.meltingRevealedBase,
        mintPageUrl: DOMAINS.meltingDETH,
      },
      amanda: {
        key: "amanda",
        contractName: "AmandaMemorial",
        name: "Amanda dETH",
        symbol: "AMANDETH",
        maxSupply: 2020,
        mintPriceWei: parseEther("0.02020"),
        unrevealedURI: SHARED_URIS.amandaUnrevealed,
        revealedBaseURI: SHARED_URIS.amandaRevealedBase,
        mintPageUrl: DOMAINS.amandaDETH,
      },
    },
  };
}

function normalizeAddress(value: string): Address {
  if (!value) {
    throw new Error("Missing address value");
  }

  if (value === zeroAddress) {
    throw new Error("Zero address is not allowed");
  }

  return getAddress(value) as Address;
}

function getOptionalAddressEnv(name: string): Address {
  const value = process.env[name];

  if (!value) {
    return zeroAddress;
  }

  return normalizeAddress(value);
}
