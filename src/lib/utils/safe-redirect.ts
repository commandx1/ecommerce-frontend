const PLACEHOLDER_ORIGIN = "http://safe-redirect.invalid"

/**
 * Guards a `?redirect=` query value against being used to navigate somewhere unsafe: an open
 * redirect, or back onto /login itself (which would loop the login flow). Anything that isn't a
 * same-origin path falls back to "/".
 *
 * The value is resolved the way the browser will resolve it rather than pattern-matched: string
 * checks miss that URL parsing strips tabs/newlines ("/\t/evil.com" becomes "//evil.com") and
 * treats "\" as "/". The returned path is the parsed one, so what was validated is what is used.
 */
export function safeRedirect(value: string | null | undefined): string {
  if (!value?.startsWith("/")) {
    return "/"
  }

  let url: URL
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN)
  } catch {
    return "/"
  }

  if (url.origin !== PLACEHOLDER_ORIGIN || url.pathname.startsWith("/login")) {
    return "/"
  }

  return `${url.pathname}${url.search}${url.hash}`
}
