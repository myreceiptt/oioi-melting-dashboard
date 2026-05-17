import { getAppEnv } from "@/lib/utils/env";

export function AppEnvironmentBanner() {
  const appEnv = getAppEnv();

  if (appEnv !== "sepolia") {
    return null;
  }

  return (
    <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-center text-xs font-medium text-yellow-100">
      TESTNET / SEPOLIA REHEARSAL — these production-intended domains are
      currently connected to testnet contracts.
    </div>
  );
}
