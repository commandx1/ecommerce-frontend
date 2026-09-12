"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { resolveBestPriceVendorUserProductId } from "@/features/products/product-detail/utils/productDetailTransforms"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { getProductWithOffers } from "@/lib/api/product-offers"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"

export function useAddToCartFromCard() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const addToCartInStore = useCartStore((s) => s.addToCart)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)

  const addToCart = async (productId: string, productName: string, quantity: number): Promise<boolean> => {
    // Checked before any request: an unauthenticated shopper should never trigger a network
    // call just to be told to log in.
    if (!isAuthenticated) {
      showToast.warning("Login required", "Please sign in to add products to your cart.")
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

      await addToCartInStore(bestUserProductId, qty)
      showToast.success("Added to cart", `${qty} × ${productName} added to your cart.`)
      return true
    } catch (err: unknown) {
      if (isAuthHandledError(err)) {
        return false
      }

      const status = extractErrorStatus(err)
      if (isAuthErrorStatus(status)) {
        showToast.error("Authentication required", "Please sign in to add items to cart.")
        router.push("/login")
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
