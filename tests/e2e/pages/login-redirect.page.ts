import { BasePage } from "./base.page"

/**
 * Faz 8.2 - thin POM for /login's `?redirect=` / `?reason=` query handling
 * (src/features/login/hooks/useLoginForm.ts). Deliberately minimal: this is
 * consumed by a later phase's auth-routing spec, not a spec in this file set.
 *
 * `redirectParam` / `reasonParam` mirror `useLoginForm`'s own validation
 * exactly (see `postLoginRedirect` / the `reason` effect there) so a spec can
 * assert against the *sanitised* redirect target, not the raw query string:
 *  - `redirect` is dropped (falls back to "/") unless it starts with a single
 *    "/" and isn't "//..." or "/login...".
 *  - `reason` is returned as-is; `useLoginForm` only special-cases
 *    "session-expired" and "access-denied", anything else is a no-op toast.
 */
export class LoginRedirectPage extends BasePage {
  readonly path = "/login"

  /** The sanitised post-login redirect target `useLoginForm` would push to. */
  redirectParam(url: URL): string {
    const redirect = url.searchParams.get("redirect")
    if (!redirect) return "/"
    if (!redirect.startsWith("/") || redirect.startsWith("//") || redirect.startsWith("/login")) return "/"
    return redirect
  }

  /** Raw `reason` query value, or null if absent. */
  reasonParam(url: URL): string | null {
    return url.searchParams.get("reason")
  }
}
