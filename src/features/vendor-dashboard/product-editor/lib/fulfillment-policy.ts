export const FULFILLMENT_POLICY_DAYS = [1, 2, 3, 4, 5] as const
export type FulfillmentPolicyDay = (typeof FULFILLMENT_POLICY_DAYS)[number]

/** Reads the day count back out of a policy string; null when it is empty or out of the 1-5 range. */
export function parseFulfillmentPolicyDays(value: string | undefined): FulfillmentPolicyDay | null {
  const dayMatch = value?.match(/\b([1-5])\b/)
  return dayMatch ? (Number(dayMatch[1]) as FulfillmentPolicyDay) : null
}

// "days" is also the unit shown next to the dropdown before anything is picked.
export const getFulfillmentPolicyDayUnit = (days: number | null) => (days === 1 ? "day" : "days")

export const getFulfillmentPolicyValue = (days: FulfillmentPolicyDay) =>
  `Ships within ${days} ${getFulfillmentPolicyDayUnit(days)}`

/** Maps any stored wording ("Ships within 5 business days") onto one of the dropdown's values, or "". */
export function normalizeFulfillmentPolicy(value: string | undefined): string {
  const days = parseFulfillmentPolicyDays(value)
  return days ? getFulfillmentPolicyValue(days) : ""
}
