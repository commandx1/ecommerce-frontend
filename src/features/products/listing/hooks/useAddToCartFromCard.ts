"use client"

import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { cartCommands } from "@/features/cart/api/cart-queries"
import { resolveBestPriceVendorUserProductId } from "@/features/products/product-detail/utils/productDetailTransforms"
import { isAuthHandledError } from "@/lib/api/auth-error"
import { redirectToLogin } from "@/lib/api/client"
import { getProductWithOffers } from "@/lib/api/product-offers"
import { useAuthStore } from "@/stores/authStore"

export function useAddToCartFromCard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)

  const addToCart = async (productId: string, productName: string, quantity: number): Promise<boolean> => {
    // Checked before any request: an unauthenticated shopper should never trigger a network
    // call just to be told to log in - send them to /login and let them land back here.
    if (!isAuthenticated) {
      redirectToLogin("login-required")
      return false
    }

    const qty = Math.max(1, Math.floor(quantity) || 1)

    setPendingProductId(productId)
    try {
      const data = await getProductWithOffers(productId)
      const userProducts = Array.isArray(data.userProducts) ? data.userProducts : []
      const bestUserProductId = resolveBestPriceVendorUserProductId(data.product, userProducts)

      if (!bestUserProductId) {
        showToast.error("No supplier available", "This product has no available supplier right now.")
        return false
      }

      await cartCommands.addItem(bestUserProductId, qty)
      showToast.success("Added to cart", `${qty} × ${productName} added to your cart.`)
      return true
    } catch (err: unknown) {
      if (isAuthHandledError(err)) {
        return false
      }

      showToast.error("Failed to add to cart", "Please try again.")
      return false
    } finally {
      setPendingProductId(null)
    }
  }

  return { addToCart, pendingProductId }
}
