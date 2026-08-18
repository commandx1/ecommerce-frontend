/**
 * Recurring purchase schedules.
 *
 * Mirrors the backend `AutoOrderPeriod` enum. The day counts are the ones the
 * scheduler actually uses, so the labels spell out days rather than the enum
 * name (TWO_WEEKS is 15 days, not 14).
 */
export type AutoOrderPeriod = "TWO_WEEKS" | "ONE_MONTH" | "TWO_MONTHS"

export const AUTO_ORDER_PERIODS: AutoOrderPeriod[] = ["TWO_WEEKS", "ONE_MONTH", "TWO_MONTHS"]

export const AUTO_ORDER_PERIOD_DAYS: Record<AutoOrderPeriod, number> = {
  TWO_WEEKS: 15,
  ONE_MONTH: 30,
  TWO_MONTHS: 60,
}

export const AUTO_ORDER_PERIOD_LABELS: Record<AutoOrderPeriod, string> = {
  TWO_WEEKS: "Every 15 days",
  ONE_MONTH: "Every 30 days",
  TWO_MONTHS: "Every 60 days",
}

export const DEFAULT_AUTO_ORDER_PERIOD: AutoOrderPeriod = "ONE_MONTH"

export function isAutoOrderPeriod(value: unknown): value is AutoOrderPeriod {
  return typeof value === "string" && (AUTO_ORDER_PERIODS as string[]).includes(value)
}
