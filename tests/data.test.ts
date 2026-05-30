import { describe, expect, it } from "vitest";
import {
  decideExecution,
  formatDate,
  getTargetDate,
  shouldSkipWeekend,
} from "../src/utils/date.js";

describe("date utils", () => {
  it("注文対象日は実行日の翌日になる", () => {
    const now = new Date("2026-05-25T14:00:00.000Z"); // JST 2026-05-25 23:00
    const targetDate = getTargetDate(now);

    expect(formatDate(targetDate)).toBe("2026-05-26");
  });

  it("土曜日は週末として判定される", () => {
    const saturday = new Date("2026-05-30T00:00:00.000Z");

    expect(shouldSkipWeekend(saturday)).toBe(true);
  });

  it("日曜日は週末として判定される", () => {
    const sunday = new Date("2026-05-31T00:00:00.000Z");

    expect(shouldSkipWeekend(sunday)).toBe(true);
  });

  it("平日は週末として判定されない", () => {
    const monday = new Date("2026-06-01T00:00:00.000Z");

    expect(shouldSkipWeekend(monday)).toBe(false);
  });

  it("翌日が日曜日ならスキップする", () => {
    const now = new Date("2026-05-30T14:00:00.000Z"); // JST 2026-05-30 23:00
    const decision = decideExecution(now);

    expect(decision.shouldRun).toBe(false);

    if (!decision.shouldRun) {
      expect(decision.reason).toBe("WEEKEND");
      expect(decision.targetDateText).toBe("2026-05-31");
    }
  });

  it("翌日が平日なら実行対象になる", () => {
    const now = new Date("2026-05-25T14:00:00.000Z"); // JST 2026-05-25 23:00
    const decision = decideExecution(now);

    expect(decision.shouldRun).toBe(true);
    expect(decision.targetDateText).toBe("2026-05-26");
  });

  it("翌日が祝日ならスキップする", () => {
    const now = new Date("2025-12-31T14:00:00.000Z"); // JST 2025-12-31 23:00
    const decision = decideExecution(now);

    expect(decision.shouldRun).toBe(false);

    if (!decision.shouldRun) {
      expect(decision.reason).toBe("HOLIDAY");
      expect(decision.targetDateText).toBe("2026-01-01");
    }
  });
});