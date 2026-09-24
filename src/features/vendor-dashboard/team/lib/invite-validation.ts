const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Returns the field error to show, or `null` when the (trimmed) email is valid. */
export function validateInviteEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return "Email is required."
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address."
  return null
}
