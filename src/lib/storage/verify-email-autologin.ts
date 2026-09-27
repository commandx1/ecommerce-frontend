/**
 * Bridges `/register` to `/verify-email`: the freshly-registered password is held in
 * `sessionStorage` just long enough to auto-login the shopper once their code confirms the
 * email, since the backend has no separate "verified, log me in" token to exchange instead.
 *
 * Cleared the moment it's used (auto-login succeeds), and defensively cleared again from
 * `/login`'s mount and from logout, so a shopper who registers and then abandons verification
 * (closes the tab, comes back days later, mistypes the code repeatedly) never leaves a plaintext
 * password sitting in this tab's session storage.
 */

const VERIFY_EMAIL_AUTOLOGIN_KEY = "verify_email_autologin_credentials"

export interface VerifyEmailAutologinCredentials {
  email: string
  password: string
}

export const storeVerifyEmailAutologinCredentials = (credentials: VerifyEmailAutologinCredentials): void => {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.setItem(VERIFY_EMAIL_AUTOLOGIN_KEY, JSON.stringify(credentials))
}

export const readVerifyEmailAutologinCredentials = (): VerifyEmailAutologinCredentials | null => {
  if (typeof window === "undefined") {
    return null
  }

  const raw = sessionStorage.getItem(VERIFY_EMAIL_AUTOLOGIN_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VerifyEmailAutologinCredentials>
    if (typeof parsed.email === "string" && typeof parsed.password === "string") {
      return { email: parsed.email, password: parsed.password }
    }
    return null
  } catch {
    return null
  }
}

export const clearVerifyEmailAutologinCredentials = (): void => {
  if (typeof window === "undefined") {
    return
  }

  sessionStorage.removeItem(VERIFY_EMAIL_AUTOLOGIN_KEY)
}
