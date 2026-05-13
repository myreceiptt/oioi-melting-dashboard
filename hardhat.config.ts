import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

export default defineConfig({
  plugins: [hardhatToolboxViem],

  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },

    hardhatBase: {
      type: "edr-simulated",
      chainType: "op",
      chainId: 8453,
    },

    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },

    baseMainnet: {
      type: "http",
      chainType: "op",
      chainId: 8453,
      url: configVariable("BASE_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },

    ethereumSepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: configVariable("ETHEREUM_SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },

    ethereumMainnet: {
      type: "http",
      chainType: "l1",
      chainId: 1,
      url: configVariable("ETHEREUM_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },

  paths: {
    tests: {
      nodejs: "./test",
    },
  },
});
