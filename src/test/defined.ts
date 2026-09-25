/**
 * Asserts a value the test already knows must be present (e.g. `arr[0]` right after asserting
 * `arr.length === 1`, or a regex capture group the pattern guarantees) really is defined, and
 * narrows it. Throwing here - rather than a bare `!` - fails the test with a useful message on
 * the rare occasion the invariant doesn't hold, instead of a generic TypeError deep in the
 * assertion. Exists only to satisfy `noUncheckedIndexedAccess` at call sites without scattering
 * defensive `if` guards a test will never actually trip.
 */
export function defined<T>(value: T | undefined, message = "expected value to be defined"): T {
  if (value === undefined) throw new Error(message)
  return value
}
