import { addDays, format, isSaturday, isSunday } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { isJapaneseHoliday } from "../services/holidayService.js";
import type { ExecutionDecision } from "../types/order.js";

const TIME_ZONE = "Asia/Tokyo";

export function getTargetDate(now: Date = new Date()): Date {
  const nowJst = toZonedTime(now, TIME_ZONE);
  return addDays(nowJst, 1);
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function shouldSkipWeekend(date: Date): boolean {
  return isSaturday(date) || isSunday(date);
}

export function decideExecution(now: Date = new Date()): ExecutionDecision {
  const targetDate = getTargetDate(now);
  const targetDateText = formatDate(targetDate);

  if (shouldSkipWeekend(targetDate)) {
    return {
      shouldRun: false,
      targetDate,
      targetDateText,
      reason: "WEEKEND",
    };
  }

  if (isJapaneseHoliday(targetDate)) {
    return {
      shouldRun: false,
      targetDate,
      targetDateText,
      reason: "HOLIDAY",
    };
  }

  return {
    shouldRun: true,
    targetDate,
    targetDateText,
  };
}