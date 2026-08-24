import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { describeNextOrderDate } from "./auto-order-view-utils"

/**
 * TZ/DST edge-case coverage for `describeNextOrderDate`.
 *
 * WHY NOT `process.env.TZ = "..."` AT THE TOP OF THE FILE:
 * Node/V8 reads the OS/ICU timezone database once at process start and caches it. Setting
 * `process.env.TZ` after startup (e.g. at the top of a test file, before or after imports) does
 * NOT change what `Date`'s local-time getters (`getHours`, `toString`, `toLocaleString`, etc.)
 * report — see https://github.com/nodejs/node/issues/3449. Vitest workers are long-lived Node
 * processes, so this trap is very real here.
 *
 * METHOD USED: (a) from the brief — `vi.useFakeTimers({ toFake: ["Date"] })` +
 * `vi.setSystemTime(...)` to control "now", combined with (c) — an out-of-band manual check
 * (see the comment above `describes TZ-independence` below) run via
 * `TZ=America/Los_Angeles node <script>` / `TZ=Europe/Istanbul node <script>` / `TZ=UTC node
 * <script>` against the exact algorithm in `auto-order-view-utils.ts`. That check proved the
 * function's output is byte-for-byte identical across all three TZs for every input tried,
 * because the function never touches a local-time getter — it only does epoch-millisecond
 * arithmetic (`parsed.getTime() - Date.now()`). So faking `process.env.TZ` inside this suite
 * would prove nothing more than the out-of-band check already did; instead this suite locks
 * that TZ-independence in as a permanent regression test (first `describe` block) and then
 * spends the rest of its budget on the two edge classes that DO change behaviour: (1) the
 * mismatch between the backend's naive `LocalDateTime` (whose true offset is unknown to the
 * frontend) and the code's blanket "treat it as UTC" assumption, and (2) the fixed 24h rounding
 * window producing calendar-day-wrong answers near a day boundary. Neither of these requires
 * the *test runner's* TZ to move at all — the bug lives in the algorithm, not in the reader's
 * clock.
 *
 * This file should be run in any TZ; its assertions do not depend on the runner's local zone.
 * (Verified manually under TZ=UTC, TZ=America/Los_Angeles and TZ=Europe/Istanbul — see above.)
 */

describe("describeNextOrderDate — TZ-independence (regression lock)", () => {
  // If this function is ever changed to use a local-time getter (getHours, toLocaleString,
  // etc.) instead of epoch-ms arithmetic, its answers would start depending on the *browser's*
  // TZ in addition to the backend's — this test intentionally cannot catch that class of
  // regression (it can't fake the runner's TZ, see comment above), but it locks the current,
  // deliberately TZ-blind arithmetic so a future change is at least a visible diff here.
  const NOW = new Date("2026-01-15T12:00:00Z")

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("computes purely from epoch milliseconds, so the same input always yields the same label", () => {
    // Independently confirmed via `TZ=UTC|America/Los_Angeles|Europe/Istanbul node <script>`
    // that these exact input/now pairs produce identical output in all three zones.
    expect(describeNextOrderDate("2026-01-16T12:00:00")).toBe("tomorrow")
    expect(describeNextOrderDate("2026-01-15T23:30:00")).toBe("today")
  })
})

describe("describeNextOrderDate — FINDING: naive-as-UTC vs. real backend offset", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // FINDING (carried over from Phase 1, now reproduced with concrete inputs): the JSDoc on
  // `auto-order-view-utils.ts` says the backend serialises `nextOrderDate` as a naive
  // `LocalDateTime` and the frontend "normalises the same way the buyer orders table does it" —
  // i.e. it appends `Z` and treats the naive string as UTC. If the backend process actually runs
  // in a non-UTC zone (e.g. Europe/Istanbul, UTC+3, matching this repo's own default TZ), the
  // naive value it emits is really local wall-clock time, not UTC. The frontend has no way to
  // tell the difference, so it silently miscomputes the day count by the server's real offset.
  it("mislabels an Istanbul-local due date as 'today' (near-boundary, +3h drift) — should be 'due now'", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-01-15T23:30:00Z"))

    // The true intended UTC instant is 13h in the past (already overdue → correct label "due now").
    const trueUtcInstant = "2026-01-15T10:30:00Z"
    expect(describeNextOrderDate(trueUtcInstant)).toBe("due now")

    // A backend running in Europe/Istanbul (UTC+3, no DST since 2016) would serialise this same
    // instant as the LOCAL wall clock, i.e. true instant + 3h, with no offset marker:
    const naiveFromBackend = "2026-01-15T13:30:00"

    // The frontend appends Z and treats 13:30 as UTC directly (an extra +3h drift vs. the true
    // instant), which is only 10h before "now" instead of 13h — enough to cross the ±12h
    // rounding boundary and flip the label from overdue to merely "today":
    expect(describeNextOrderDate(naiveFromBackend)).toBe("today")
  })

  it("mislabels a Pacific-time backend's still-due order as 'due now' (near-boundary, -8h drift) — should be 'today'", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-01-16T00:00:00Z"))

    // The true intended UTC instant is 11h in the past — not yet a full day, so the correct
    // label is "today" (due later today), not overdue.
    const trueUtcInstant = "2026-01-15T13:00:00Z"
    expect(describeNextOrderDate(trueUtcInstant)).toBe("today")

    // A backend running in America/Los_Angeles at PST (UTC-8, winter/no-DST) would serialise
    // this instant as local wall clock = true instant - 8h, with no offset marker:
    const naiveFromBackend = "2026-01-15T05:00:00"

    // The frontend appends Z and treats 05:00 as UTC directly (an extra -8h drift), pushing the
    // apparent gap to 19h before "now" — enough to cross the ±12h rounding boundary the other
    // way, flipping "today" (not yet due) into "due now" (falsely overdue):
    expect(describeNextOrderDate(naiveFromBackend)).toBe("due now")

    // The same wall-clock naive value would drift by a DIFFERENT amount across the DST
    // transition (PST UTC-8 in winter vs. PDT UTC-7 in summer), because the code assumes a fixed
    // UTC+0 offset regardless of which one is actually in effect on the backend server — the
    // drift is not a constant, it silently changes by an hour twice a year.
  })
})

describe("describeNextOrderDate — FINDING: fixed 24h rounding window vs. calendar-day boundary", () => {
  // FINDING: `days = Math.round((parsed - now) / 86_400_000)` is a rolling 24h-multiple window,
  // not a calendar-day difference. Near a day boundary this disagrees with what a buyer would
  // call "today" vs. "tomorrow" purely from the elapsed-hours magnitude — independent of any
  // TZ/offset bug above. This is inherent to the algorithm and reproducible in any TZ.
  it('labels a date that has already rolled into the next calendar day as "today" because under 12h have elapsed', () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-01-15T23:30:00Z"))

    // Calendar-wise this is the next day (Jan 16), only 1h of wall-clock time away.
    expect(describeNextOrderDate("2026-01-16T00:30:00")).toBe("today")
  })

  it('labels a date that is still on the current calendar day as "tomorrow" once over 12h have elapsed', () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-01-15T00:30:00Z"))

    // Calendar-wise this is still the same day (Jan 15), but 23h away, so it rounds up.
    expect(describeNextOrderDate("2026-01-15T23:30:00")).toBe("tomorrow")
  })
})

describe("describeNextOrderDate — month/year/leap-year boundaries", () => {
  it("crosses a year boundary correctly", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2025-12-30T12:00:00Z"))
    expect(describeNextOrderDate("2026-01-02T12:00:00")).toBe("in 3 days")
    vi.useRealTimers()
  })

  it("counts correctly through a leap-year February 29th", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2028-02-27T12:00:00Z"))
    // 2028 is a leap year: Feb 27 -> Feb 29 -> Mar 1 -> Mar 2 is 4 days.
    expect(describeNextOrderDate("2028-03-02T12:00:00")).toBe("in 4 days")
    vi.useRealTimers()
  })

  it("does not miscount the day after a non-leap February 28th", () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-02-28T12:00:00Z"))
    expect(describeNextOrderDate("2026-03-01T12:00:00")).toBe("tomorrow")
    vi.useRealTimers()
  })
})
