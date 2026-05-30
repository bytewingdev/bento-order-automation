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