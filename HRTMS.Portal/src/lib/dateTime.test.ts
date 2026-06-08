import { describe, expect, it } from "vitest";
import {
  addLocalDays,
  calendarDaysBetween,
  parseLocalDateTime,
  toLocalDateString,
} from "./dateTime";

describe("local date helpers", () => {
  it("formats calendar dates from local components", () => {
    expect(toLocalDateString(new Date(2026, 5, 2, 23, 30))).toBe("2026-06-02");
  });

  it("adds calendar days across month boundaries", () => {
    expect(addLocalDays(1, new Date(2026, 5, 30, 23, 30))).toBe("2026-07-01");
  });

  it("parses a local date and time without UTC conversion", () => {
    const parsed = parseLocalDateTime("2026-06-02", "14:05");
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(5);
    expect(parsed?.getDate()).toBe(2);
    expect(parsed?.getHours()).toBe(14);
    expect(parsed?.getMinutes()).toBe(5);
  });

  it("computes calendar differences independently of daylight savings", () => {
    expect(calendarDaysBetween("2026-03-07", "2026-03-09")).toBe(2);
  });
});
