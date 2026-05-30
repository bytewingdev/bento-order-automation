import holidayJp from "@holiday-jp/holiday_jp";

export function isJapaneseHoliday(date: Date): boolean {
  return holidayJp.isHoliday(date);
}