export type SkipReason = "WEEKEND" | "HOLIDAY";

export type ExecutionDecision =
  | {
      shouldRun: true;
      targetDate: Date;
      targetDateText: string;
    }
  | {
      shouldRun: false;
      targetDate: Date;
      targetDateText: string;
      reason: SkipReason;
    };

export type OrderResult =
  | {
      success: true;
      status: "ORDER_CONFIRMED" | "DRY_RUN_COMPLETED" | "ALREADY_ORDERED";
      targetDate: string;
      menuName?: string;
      price?: number;
      screenshotPath?: string;
    }
  | {
      success: false;
      status:
        | "FAILED_LOGIN"
        | "FAILED_NAVIGATION"
        | "FAILED_VALIDATION"
        | "FAILED_ORDER_CONFIRM"
        | "FAILED_UNKNOWN";
      reason: string;
      targetDate?: string;
      screenshotPath?: string;
    };