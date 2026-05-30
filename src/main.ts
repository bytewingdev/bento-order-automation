import { env } from "./config/env.js";
import { loginToObento } from "./services/orderService.js";
import { decideExecution } from "./utils/date.js";
import { logError, logInfo } from "./utils/logger.js";

async function main() {
  logInfo("Obento auto order started", {
    nodeEnv: env.NODE_ENV,
    orderExecute: env.ORDER_EXECUTE,
    targetSiteUrl: env.TARGET_SITE_URL,
  });

  const decision = decideExecution();

  if (!decision.shouldRun) {
    logInfo("Order skipped", {
      status: `SKIPPED_${decision.reason}`,
      targetDate: decision.targetDateText,
      reason: decision.reason,
    });

    return;
  }

  logInfo("Order execution allowed", {
    status: "READY_TO_ORDER",
    targetDate: decision.targetDateText,
    orderExecute: env.ORDER_EXECUTE,
  });

  if (!env.ORDER_EXECUTE) {
    logInfo("Dry run mode enabled", {
      status: "DRY_RUN",
      message: "Order confirmation will be skipped in later phases",
    });
  }

    const loginResult = await loginToObento();

    if (!loginResult.success) {
    logError("Login failed", {
        status: "FAILED_LOGIN",
        reason: loginResult.reason,
        screenshotPath: loginResult.screenshotPath,
        currentUrl: loginResult.currentUrl,
        title: loginResult.title,
    });

    process.exit(1);
    }

    logInfo("Login succeeded", {
    status: "LOGIN_SUCCEEDED",
    currentUrl: loginResult.currentUrl,
    title: loginResult.title,
    });

  // Phase 6以降で注文フローを追加する
}

main().catch((error) => {
  logError("Unhandled error", {
    error: error instanceof Error ? error.message : String(error),
  });

  process.exit(1);
});