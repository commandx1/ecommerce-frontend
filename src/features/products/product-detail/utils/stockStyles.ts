export const getStockColorClass = (color: string) => {
  if (color === "green") return "bg-success/14 text-success"
  if (color === "yellow") return "bg-warning/14 text-warning"
  return "bg-surface-muted text-text-secondary"
}
