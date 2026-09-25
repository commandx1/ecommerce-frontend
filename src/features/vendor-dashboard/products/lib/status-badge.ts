export function getStockColor(stock: number): string {
  if (stock === 0) return "text-danger"
  if (stock < 20) return "text-warning"
  return "text-success"
}

export function getStatusBadgeColor(status: "Active" | "Inactive" | "Archived"): string {
  switch (status) {
    case "Active":
      return "border border-success/20 bg-success/14 text-success"
    case "Inactive":
      return "border border-warning/20 bg-warning/14 text-warning"
    case "Archived":
      return "border border-border-soft bg-surface-muted text-text-primary"
    default:
      return "border border-border-soft bg-surface-muted text-text-primary"
  }
}
