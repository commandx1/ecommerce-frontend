export const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "").slice(0, 10)

export const formatPhoneNumber = (value: string) => {
  const digits = normalizePhoneNumber(value)
  if (digits.length <= 3) return digits ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}
