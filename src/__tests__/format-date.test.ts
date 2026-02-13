import { formatRelativeDate } from "../utils/format-date.js";

const NOW = new Date("2026-02-13T12:00:00.000Z").getTime();

describe("formatRelativeDate", () => {
  it('should return "just now" for dates less than 60 seconds ago', () => {
    expect(formatRelativeDate("2026-02-13T11:59:30.000Z", NOW)).toBe("just now");
    expect(formatRelativeDate("2026-02-13T11:59:59.000Z", NOW)).toBe("just now");
  });

  it("should return minutes ago for dates less than 1 hour ago", () => {
    expect(formatRelativeDate("2026-02-13T11:59:00.000Z", NOW)).toBe("1 minute ago");
    expect(formatRelativeDate("2026-02-13T11:55:00.000Z", NOW)).toBe("5 minutes ago");
    expect(formatRelativeDate("2026-02-13T11:01:00.000Z", NOW)).toBe("59 minutes ago");
  });

  it("should return hours ago for dates less than 1 day ago", () => {
    expect(formatRelativeDate("2026-02-13T11:00:00.000Z", NOW)).toBe("1 hour ago");
    expect(formatRelativeDate("2026-02-13T09:00:00.000Z", NOW)).toBe("3 hours ago");
    expect(formatRelativeDate("2026-02-12T13:00:00.000Z", NOW)).toBe("23 hours ago");
  });

  it("should return days ago for dates less than 7 days ago", () => {
    expect(formatRelativeDate("2026-02-12T12:00:00.000Z", NOW)).toBe("1 day ago");
    expect(formatRelativeDate("2026-02-10T12:00:00.000Z", NOW)).toBe("3 days ago");
    expect(formatRelativeDate("2026-02-07T12:00:00.000Z", NOW)).toBe("6 days ago");
  });

  it("should return short date for dates 7 or more days ago", () => {
    expect(formatRelativeDate("2026-02-06T12:00:00.000Z", NOW)).toBe("Feb 6, 2026");
    expect(formatRelativeDate("2026-01-01T00:00:00.000Z", NOW)).toBe("Jan 1, 2026");
    expect(formatRelativeDate("2024-06-15T00:00:00.000Z", NOW)).toBe("Jun 15, 2024");
  });

  it("should return empty string for undefined or empty input", () => {
    expect(formatRelativeDate(undefined, NOW)).toBe("");
    expect(formatRelativeDate("", NOW)).toBe("");
  });

  it("should return the original string for invalid dates", () => {
    expect(formatRelativeDate("not-a-date", NOW)).toBe("not-a-date");
    expect(formatRelativeDate("abc123", NOW)).toBe("abc123");
  });

  it("should return the original string for future dates", () => {
    expect(formatRelativeDate("2026-03-01T00:00:00.000Z", NOW)).toBe("2026-03-01T00:00:00.000Z");
  });
});
