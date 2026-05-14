import { getDeployConfig } from "./00-config.js";

const networkName = process.argv[2] || "baseMainnet";
const config = getDeployConfig(networkName);

console.log(
  JSON.stringify(
    {
      key: config.key,
      chainId: config.chainId,
      label: config.label,
      deploymentOutputDir: config.deploymentOutputDir,
      explorerName: config.explorerName,
      explorerUrl: config.explorerUrl,
      oioiTokenAddress: config.oioiTokenAddress,
      originUrl: config.originUrl,
      dashboardUrl: config.dashboardUrl,
      collections: config.collections,
    },
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  ),
);
