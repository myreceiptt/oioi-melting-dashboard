import "dotenv/config";
import { getIndexerNetworkConfig } from "./config.js";
import {
  initializeEmptyDataFiles,
  readDeploymentRecord,
  readOrCreateCheckpoints,
  writeMetadata,
} from "./storage.js";

async function main() {
  const networkKey = process.argv[2];
  const config = getIndexerNetworkConfig(networkKey);
  const deployment = readDeploymentRecord(config);

  writeMetadata({ config });
  initializeEmptyDataFiles(config);
  readOrCreateCheckpoints({ config, deployment });

  console.log("Indexer sync skeleton initialized.");
  console.log({
    network: config.key,
    chainId: config.chainId,
    outputDir: config.outputDir,
  });
  console.log("Event sync will be implemented in the next phase.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
