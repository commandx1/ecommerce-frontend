"use client"

import CartContent from "@/features/cart/components/CartContent"
import CartEmptyState from "@/features/cart/components/CartEmptyState"
import CartLoadingState from "@/features/cart/components/CartLoadingState"
import { useCartPage } from "@/features/cart/hooks/useCartPage"

export default function CartPage() {
  const cartPage = useCartPage()

  if (cartPage.viewState === "loading") {
    return <CartLoadingState />
  }

  if (cartPage.viewState === "empty") {
    return <CartEmptyState onContinueShopping={cartPage.onContinueShopping} />
  }

  return (
    <CartContent
      cartId={cartPage.cartId}
      blockingItemsCount={cartPage.blockingItemsCount}
      hasBlockingItems={cartPage.hasBlockingItems}
      isClearConfirmOpen={cartPage.isClearConfirmOpen}
      isTaxLoading={cartPage.isTaxLoading}
      items={cartPage.items}
      sellerGroups={cartPage.sellerGroups}
      onCheckout={cartPage.onCheckout}
      onCloseClearConfirm={cartPage.onCloseClearConfirm}
      onConfirmClearCart={cartPage.onConfirmClearCart}
      onOpenClearConfirm={cartPage.onOpenClearConfirm}
      onQuantityChange={cartPage.onQuantityChange}
      onRemoveItem={cartPage.onRemoveItem}
      totals={cartPage.totals}
    />
  )
}
