export const CHAINS = {
  base: {
    key: "base",
    label: "Base",
    chainId: 8453,
    testnetChainId: 84532,
    explorerUrl: "https://basescan.org",
    testnetExplorerUrl: "https://sepolia.basescan.org",
  },

  ethereum: {
    key: "ethereum",
    label: "Ethereum",
    chainId: 1,
    testnetChainId: 11155111,
    explorerUrl: "https://etherscan.io",
    testnetExplorerUrl: "https://sepolia.etherscan.io",
  },
} as const;
