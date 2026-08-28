// Strips everything but digits. If the result is exactly 11 digits and starts with the
// NANP country code "1" (e.g. a pasted "+1 415 555 0123" or an accidentally-included
// leading "1"), the country code is dropped so the real 10-digit number is recovered.
// NANP area codes never start with "0" or "1", so this heuristic cannot misfire on a
// genuine 11-digit local number.
//
// Any other length (10 or fewer, or more than 11, or 11 digits not starting with "1") is
// returned unchanged rather than silently truncated — silently dropping digits from a
// phone number produces a *different, valid-looking* number that fails silently at
// delivery time (missed order/shipping notifications). Callers that require an exact
// 10-digit number (e.g. the registration form's zod schema) validate the returned value
// and surface an error instead of accepting corrupted data.
export const normalizePhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1)
  }
  return digits
}

export const formatPhoneNumber = (value: string) => {
  const digits = normalizePhoneNumber(value)
  if (digits.length <= 3) return digits ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
