import { decideExecution } from "./utils/date.js";
import { logError, logInfo } from "./utils/logger.js";

async function main() {
  logInfo("自動注文処理開始");

  const decision = decideExecution();

  if (!decision.shouldRun) {
    logInfo("注文がスキップされました", {
      status: `SKIPPED_${decision.reason}`,
      targetDate: decision.targetDateText,
      reason: decision.reason,
    });

    return;
  }

  logInfo("注文が許可されました", {
    status: "READY_TO_ORDER",
    targetDate: decision.targetDateText,
  });

  // Phase 4以降で注文処理を追加する
}

main().catch((error) => {
  logError("Unhandled error", {
    error: error instanceof Error ? error.message : String(error),
  });

  process.exit(1);
});