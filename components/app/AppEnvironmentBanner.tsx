import { getAppEnv } from "@/lib/utils/env";

export function AppEnvironmentBanner() {
  const appEnv = getAppEnv();

  if (appEnv !== "sepolia") {
    // return null;
    return (
      <div className="border-b border-white/10 bg-[#b7f56d] px-4 py-2 text-center text-xs font-medium text-black">
        MAINNET / PRODUCTION — these production-intended domains are currently
        connected to mainnet contracts.
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 bg-[#ff9b4a] px-4 py-2 text-center text-xs font-medium text-black">
      TESTNET / SEPOLIA REHEARSAL — these production-intended domains are
      currently connected to testnet contracts.
    </div>
  );
}
