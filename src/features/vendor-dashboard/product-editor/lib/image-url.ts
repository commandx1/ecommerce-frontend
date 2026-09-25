/** True for an absolute http(s) URL; used for image links and the manufacturer page. */
export function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
