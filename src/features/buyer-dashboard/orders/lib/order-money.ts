import type { BuyerOrderItem } from "@/lib/api/buyer-orders"

export function resolveOrderMoneyBreakdown(
  itemTotal: number,
  shippingTotal: number,
  explicitTotal?: number,
): {
  tax: number
  netTotal: number
} {
  const baseTotal = itemTotal + shippingTotal
  const netTotal = typeof explicitTotal === "number" && Number.isFinite(explicitTotal) ? explicitTotal : baseTotal

  if (netTotal < baseTotal) {
    return { tax: 0, netTotal }
  }

  if (netTotal > baseTotal) {
    return { tax: netTotal - baseTotal, netTotal }
  }

  return { tax: 0, netTotal }
}

export function getOrderItemShipmentFee(item: BuyerOrderItem): number {
  return typeof item.shipmentPrice === "number" && Number.isFinite(item.shipmentPrice) ? item.shipmentPrice : 0
}

export function getOrderItemHeavyShipmentFee(item: BuyerOrderItem): number {
  return typeof item.takedHeavyShipmentFee === "number" && Number.isFinite(item.takedHeavyShipmentFee)
    ? item.takedHeavyShipmentFee
    : 0
}

export function getOrderItemTaxPrice(item: BuyerOrderItem): number {
  return typeof item.taxPrice === "number" && Number.isFinite(item.taxPrice) ? item.taxPrice : 0
}
