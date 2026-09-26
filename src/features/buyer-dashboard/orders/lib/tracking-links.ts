import type { BuyerOrderItem, BuyerOrderTrackingLink } from "@/lib/api/buyer-orders"
import { hasOrderItemReturnFlowStarted } from "./return-flow"

export function resolveTrackingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  if (Array.isArray(item.trackingLinks) && item.trackingLinks.length > 0) {
    return item.trackingLinks.filter((entry) => typeof entry.trackingUrl === "string" && entry.trackingUrl.length > 0)
  }

  if (Array.isArray(item.trackingLink) && item.trackingLink.length > 0) {
    return item.trackingLink
      .filter((url) => typeof url === "string" && url.length > 0)
      .map((url) => ({ trackingUrl: url }))
  }

  return []
}

export function resolveReturnTrackingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  return Array.isArray(item.returnTrackingLinks)
    ? item.returnTrackingLinks.filter((entry) => typeof entry.trackingUrl === "string" && entry.trackingUrl.length > 0)
    : []
}

export function resolveShippingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  if (Array.isArray(item.shippingLinks) && item.shippingLinks.length > 0) {
    return item.shippingLinks
      .filter((entry) => typeof entry.shippingUrl === "string" && entry.shippingUrl.length > 0)
      .map((entry) => ({
        trackingUrl: entry.shippingUrl,
        status: entry.status,
        updatedDate: entry.updatedDate,
      }))
  }

  if (Array.isArray(item.shippingLink) && item.shippingLink.length > 0) {
    return item.shippingLink
      .filter((url) => typeof url === "string" && url.length > 0)
      .map((url) => ({ trackingUrl: url }))
  }

  return []
}

export function resolveReturnShippingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  return Array.isArray(item.returnShippingLinks)
    ? item.returnShippingLinks
        .filter((entry) => typeof entry.shippingUrl === "string" && entry.shippingUrl.length > 0)
        .map((entry) => ({
          trackingUrl: entry.shippingUrl,
          status: entry.status,
          updatedDate: entry.updatedDate,
        }))
    : []
}

export function resolveActiveTrackingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  if (hasOrderItemReturnFlowStarted(item)) {
    const returnTrackingLinks = resolveReturnTrackingLinks(item)
    if (returnTrackingLinks.length > 0) {
      return returnTrackingLinks
    }

    return resolveReturnShippingLinks(item).length > 0 ? [] : resolveTrackingLinks(item)
  }

  return resolveTrackingLinks(item)
}

export function resolveActiveShippingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  if (hasOrderItemReturnFlowStarted(item)) {
    const returnShippingLinks = resolveReturnShippingLinks(item)
    if (returnShippingLinks.length > 0) {
      return returnShippingLinks
    }

    return resolveReturnTrackingLinks(item).length > 0 ? [] : resolveShippingLinks(item)
  }

  return resolveShippingLinks(item)
}

/**
 * True when `resolveActiveShippingLinks` is showing the return-to-seller label(s) rather than the
 * original outbound one. Mirrors that function's own branching exactly (rather than just checking
 * `hasOrderItemReturnFlowStarted`) because a return can be started before the seller has generated
 * a return-specific label - in that gap `resolveActiveShippingLinks` still falls back to the
 * outbound `shippingLinks`, and the label text must fall back with it.
 */
export function isActiveShippingLinkReturn(item: BuyerOrderItem): boolean {
  return hasOrderItemReturnFlowStarted(item) && resolveReturnShippingLinks(item).length > 0
}

export function getTrackingLinkCount(orderItems: BuyerOrderItem[]): number {
  const linkSet = new Set<string>()

  for (const item of orderItems) {
    for (const link of resolveTrackingLinks(item)) {
      if (link.trackingUrl) {
        linkSet.add(link.trackingUrl)
      }
    }
  }

  return linkSet.size
}
