export const getStockColorClass = (color: string) => {
  if (color === "green") return "bg-green-100 text-green-800"
  if (color === "yellow") return "bg-yellow-100 text-yellow-800"
  return "bg-gray-100 text-gray-800"
}
