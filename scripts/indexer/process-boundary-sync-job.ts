import "dotenv/config";
import { processBoundarySyncBatch } from "@/lib/indexer/boundarySyncWorker.js";
import { createSupabaseServiceClient } from "@/lib/supabase/server.js";

async function main() {
  const supabase = createSupabaseServiceClient();
  const result = await processBoundarySyncBatch({
    supabase,
    requestSecret: process.env.INDEXER_CRON_SECRET ?? null,
  });

  console.log("Boundary sync worker batch complete.");
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
