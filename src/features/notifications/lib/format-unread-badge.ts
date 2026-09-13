export function formatUnreadBadge(count: number | undefined | null): string | null {
  if (count === undefined || count === null || !Number.isFinite(count) || count <= 0) {
    return null
  }

  return count > 99 ? "99+" : String(count)
}
