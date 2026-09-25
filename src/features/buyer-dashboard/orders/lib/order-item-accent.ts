/** Maps an order item's status to the left-accent border/background classes used on its card. */
export function getItemAccentClasses(
  statusValue: string | undefined,
  cancelledByCustomer: boolean,
  cancelledBySeller: boolean,
): string {
  if (cancelledByCustomer || cancelledBySeller) return "border-l-danger bg-background"
  const s = (statusValue ?? "").toUpperCase()
  if (s.includes("REJECT")) return "border-l-danger bg-background"
  if (s === "DELIVERED") return "border-l-success bg-background"
  if (s.includes("RETURN")) return "border-l-brand bg-background"
  if (s.includes("SHIP") || s.includes("TRANSIT")) return "border-l-brand bg-background"
  return "border-l-border-strong/50 bg-background"
}
