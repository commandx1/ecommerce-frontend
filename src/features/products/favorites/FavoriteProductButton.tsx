"use client"

import { Heart } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { useFavoriteProductsStore, useIsFavoriteProduct } from "@/stores/favoriteProductsStore"

interface FavoriteProductButtonProps {
  productId: string
  className?: string
}

export default function FavoriteProductButton({ productId, className }: FavoriteProductButtonProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFavorite = useIsFavoriteProduct(productId)
  const toggle = useFavoriteProductsStore((s) => s.toggle)
  const hydrate = useFavoriteProductsStore((s) => s.hydrate)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (isAuthenticated) void hydrate()
  }, [isAuthenticated, hydrate])

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      showToast.warning("Login required", "Please sign in to save products to your favorites.")
      return
    }

    if (isPending) return

    setIsPending(true)
    try {
      await toggle(productId)
    } catch {
      showToast.error("Action failed", "Could not update favorites. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
      disabled={isPending}
      onClick={handleClick}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-surface-elevated/95 text-text-secondary shadow-soft transition-colors hover:text-rose-500",
        isFavorite && "text-rose-500",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
    </button>
  )
}
