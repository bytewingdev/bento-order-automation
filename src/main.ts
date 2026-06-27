import { env } from "./config/env.js";
import { orderObento } from "./services/orderService.js";
import { decideExecution } from "./utils/date.js";
import { logError, logInfo } from "./utils/logger.js";

async function main() {
  logInfo("弁当注文自動化を開始しました", {
    nodeEnv: env.NODE_ENV,
    orderExecute: env.ORDER_EXECUTE,
    targetSiteUrl: env.TARGET_SITE_URL,
  });

  const decision = decideExecution();

  if (!decision.shouldRun) {
    logInfo("注文処理をスキップしました", {
      status: `SKIPPED_${decision.reason}`,
      targetDate: decision.targetDateText,
      reason: decision.reason,
    });

    return;
  }

  logInfo("注文処理の実行対象日です", {
    status: "READY_TO_ORDER",
    targetDate: decision.targetDateText,
    orderExecute: env.ORDER_EXECUTE,
  });

  const orderResult = await orderObento(decision.targetDateText);

  if (!orderResult.success) {
    logError("注文処理に失敗しました", {
      status: orderResult.status,
      reason: orderResult.reason,
      targetDate: orderResult.targetDate,
      screenshotPath: orderResult.screenshotPath,
    });

    process.exit(1);
  }

  logInfo("注文フローが正常に完了しました", {
    status: orderResult.status,
    targetDate: orderResult.targetDate,
    menuName: orderResult.menuName,
    price: orderResult.price,
    screenshotPath: orderResult.screenshotPath,
  });
}

main().catch((error) => {
  logError("予期しないエラーが発生しました", {
    error: error instanceof Error ? error.message : String(error),
  });

  process.exit(1);
});