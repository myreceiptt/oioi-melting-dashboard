import "dotenv/config";
import fs from "node:fs";
import {
  createPublicClient,
  getAddress,
  http,
  isAddress,
  zeroAddress,
  zeroHash,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  DEPLOYER_ADDRESS,
  getDeployConfig,
  isLocalSimulatedDeployNetwork,
} from "./00-config.js";
import { readDeploymentRecord } from "./deployment-state.js";
import { readRotyMerkleRoot } from "./whitelist-root.js";

type NetworkPreflightConfig = {
  rpcEnv?: string;
  expectedChainId: number;
  rewardTokenEnv?: string;
};

const NETWORK_PREFLIGHT: Record<string, NetworkPreflightConfig> = {
  hardhatBase: {
    expectedChainId: 8453,
  },
  hardhatMainnet: {
    expectedChainId: 31337,
  },
  baseSepolia: {
    rpcEnv: "BASE_SEPOLIA_RPC_URL",
    expectedChainId: 84532,
    rewardTokenEnv: "BASE_SEPOLIA_OIOI_TOKEN",
  },
  ethereumSepolia: {
    rpcEnv: "ETHEREUM_SEPOLIA_RPC_URL",
    expectedChainId: 11155111,
    rewardTokenEnv: "ETHEREUM_SEPOLIA_OIOI_TOKEN",
  },
  baseMainnet: {
    rpcEnv: "BASE_RPC_URL",
    expectedChainId: 8453,
  },
  ethereumMainnet: {
    rpcEnv: "ETHEREUM_RPC_URL",
    expectedChainId: 1,
  },
};

function getNetworkName() {
  const positional = process.argv[2];

  if (positional) {
    return positional;
  }

  const networkArgIndex = process.argv.findIndex(
    (arg) => arg === "--network-name",
  );

  if (networkArgIndex >= 0) {
    const value = process.argv[networkArgIndex + 1];

    if (!value) {
      throw new Error("Missing value after --network-name");
    }

    return value;
  }

  throw new Error(
    "Missing network name. Usage: npm run deploy:preflight -- baseSepolia",
  );
}

function normalizePrivateKey(value: string): Hex {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("PRIVATE_KEY is empty");
  }

  const withPrefix = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;

  if (!/^0x[a-fA-F0-9]{64}$/.test(withPrefix)) {
    throw new Error("PRIVATE_KEY must be 32 bytes hex");
  }

  return withPrefix as Hex;
}

function assertAddress(label: string, value: string) {
  if (!isAddress(value)) {
    throw new Error(`${label} is not a valid address: ${value}`);
  }

  if (getAddress(value) === zeroAddress) {
    throw new Error(`${label} cannot be zero address`);
  }

  return getAddress(value) as Address;
}

async function checkRpcChainId(
  networkName: string,
  rpcUrl: string,
  expectedChainId: number,
) {
  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  try {
    const chainId = await client.getChainId();

    if (chainId !== expectedChainId) {
      throw new Error(
        `RPC chainId mismatch for ${networkName}. Got ${chainId}, expected ${expectedChainId}`,
      );
    }

    return chainId;
  } catch (error) {
    throw new Error(
      [
        `RPC check failed for ${networkName}.`,
        `Expected chainId: ${expectedChainId}.`,
        `This usually means the RPC URL is invalid, the API key is wrong, the provider app is not configured for this network, or the endpoint returned non-JSON text instead of JSON-RPC.`,
        `Check the related *_RPC_URL value in .env.`,
        `Original error: ${error instanceof Error ? error.message : String(error)}`,
      ].join("\n"),
    );
  }
}

function validateCollectionConfig(config: ReturnType<typeof getDeployConfig>) {
  for (const [key, collection] of Object.entries(config.collections)) {
    if (!collection.name) {
      throw new Error(`${key} collection name is empty`);
    }

    if (!collection.symbol) {
      throw new Error(`${key} collection symbol is empty`);
    }

    if (collection.mintPriceWei <= 0n) {
      throw new Error(`${key} mintPriceWei must be greater than zero`);
    }

    if (!collection.unrevealedURI) {
      throw new Error(`${key} unrevealedURI is empty`);
    }

    if (!collection.revealedBaseURI) {
      throw new Error(`${key} revealedBaseURI is empty`);
    }

    if (!collection.mintPageUrl) {
      throw new Error(`${key} mintPageUrl is empty`);
    }
  }
}

function printDeploymentRecordWarning(outputDir: string) {
  const record = readDeploymentRecord(outputDir);

  if (!record) {
    console.log("No existing deployment record found. Fresh deployment path.");
    return;
  }

  console.warn("Existing deployment record found.");
  console.warn({
    network: record.network,
    contracts: record.contracts,
    registrations: record.registrations,
    tokens: record.tokens,
  });

  const deployedContracts = Object.entries(record.contracts).filter(
    ([, value]) => Boolean(value),
  );

  if (deployedContracts.length > 0) {
    console.warn(
      "Deploy scripts may refuse to redeploy contracts already present in deployment.json.",
    );
  }
}

async function main() {
  const networkName = getNetworkName();
  const preflight = NETWORK_PREFLIGHT[networkName];

  if (!preflight) {
    throw new Error(
      `Unsupported preflight network "${networkName}". Expected: ${Object.keys(
        NETWORK_PREFLIGHT,
      ).join(", ")}`,
    );
  }

  const config = getDeployConfig(networkName);
  const local = isLocalSimulatedDeployNetwork(networkName);

  console.log("Running deployment preflight...");
  console.log({
    network: networkName,
    label: config.label,
    chainId: config.chainId,
    deploymentOutputDir: config.deploymentOutputDir,
    localSimulated: local,
  });

  if (config.chainId !== preflight.expectedChainId) {
    throw new Error(
      `Config chainId mismatch. Got ${config.chainId}, expected ${preflight.expectedChainId}`,
    );
  }

  validateCollectionConfig(config);

  const rotyMerkleRoot = readRotyMerkleRoot();

  if (rotyMerkleRoot === zeroHash) {
    throw new Error(
      "ROTY Merkle root is zeroHash. Run npm run whitelist:clean && npm run whitelist:merkle first.",
    );
  }

  console.log("ROTY Merkle root found.", {
    rotyMerkleRoot,
  });

  if (config.oioiTokenAddress === zeroAddress) {
    throw new Error(
      `$OiOi token address is zero for ${networkName}. Check .env and deploy config.`,
    );
  }

  assertAddress("$OiOi token", config.oioiTokenAddress);

  console.log("$OiOi token address valid.", {
    oioiTokenAddress: config.oioiTokenAddress,
  });

  if (!local) {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
      throw new Error("PRIVATE_KEY is required for real network deployment.");
    }

    const account = privateKeyToAccount(normalizePrivateKey(privateKey));
    const signerAddress = getAddress(account.address);
    const expectedDeployer = getAddress(DEPLOYER_ADDRESS);

    if (signerAddress !== expectedDeployer) {
      throw new Error(
        `PRIVATE_KEY does not match DEPLOYER_ADDRESS. Got ${signerAddress}, expected ${expectedDeployer}`,
      );
    }

    console.log("PRIVATE_KEY matches DEPLOYER_ADDRESS.", {
      deployer: signerAddress,
    });
  } else {
    console.log(
      "Skipping PRIVATE_KEY deployer check for local simulated network.",
    );
  }

  if (preflight.rpcEnv) {
    const rpcUrl = process.env[preflight.rpcEnv];

    if (!rpcUrl) {
      throw new Error(`${preflight.rpcEnv} is required for ${networkName}`);
    }

    const chainId = await checkRpcChainId(
      networkName,
      rpcUrl,
      preflight.expectedChainId,
    );

    console.log("RPC chainId verified.", {
      rpcEnv: preflight.rpcEnv,
      chainId,
    });
  } else {
    console.log("Skipping RPC check for local simulated network.");
  }

  if (preflight.rewardTokenEnv) {
    const rewardTokenFromEnv = process.env[preflight.rewardTokenEnv];

    if (!rewardTokenFromEnv) {
      throw new Error(
        `${preflight.rewardTokenEnv} is required for ${networkName}`,
      );
    }

    const normalizedRewardToken = assertAddress(
      preflight.rewardTokenEnv,
      rewardTokenFromEnv,
    );

    if (normalizedRewardToken !== getAddress(config.oioiTokenAddress)) {
      throw new Error(
        `${preflight.rewardTokenEnv} does not match deploy config. Env=${normalizedRewardToken}, config=${config.oioiTokenAddress}`,
      );
    }

    console.log("Testnet $OiOi env address matches deploy config.", {
      env: preflight.rewardTokenEnv,
      address: normalizedRewardToken,
    });
  }

  printDeploymentRecordWarning(config.deploymentOutputDir);

  console.log("Deployment preflight passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
