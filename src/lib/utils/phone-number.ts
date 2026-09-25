// Strips everything but digits and drops a leading NANP "1" from an 11-digit result (area codes
// never start with 0/1). Any other length is returned unchanged, never truncated - a truncated
// number looks valid but fails at delivery time; callers needing 10 digits validate the result.
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
