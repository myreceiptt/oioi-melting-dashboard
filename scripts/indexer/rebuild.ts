import "dotenv/config";
import { getIndexerNetworkConfig } from "./config.js";

async function main() {
  const networkKey = process.argv[2];
  const config = getIndexerNetworkConfig(networkKey);

  console.log("Indexer rebuild skeleton.");
  console.log({
    network: config.key,
    chainId: config.chainId,
  });
  console.log("Rebuild logic will be implemented after event sync exists.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
