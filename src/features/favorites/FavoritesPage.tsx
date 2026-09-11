"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import AnimatedTabs from "@/components/ui/animated-tabs"
import FavoriteProductsTab from "@/features/favorites/FavoriteProductsTab"
import FavoriteSuppliersPage from "@/features/suppliers/FavoriteSuppliersPage"

type FavoritesTab = "products" | "vendors"

const TAB_OPTIONS = [
  { label: "Products", value: "products" },
  { label: "Vendors", value: "vendors" },
] as const satisfies ReadonlyArray<{ label: string; value: FavoritesTab }>

export default function FavoritesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tab: FavoritesTab = searchParams.get("tab") === "vendors" ? "vendors" : "products"

  const handleTabChange = (next: FavoritesTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "products") {
      params.delete("tab")
    } else {
      params.set("tab", next)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Favorites</h1>
          <p className="mt-1 text-text-secondary">Products and vendors you have saved for quick access.</p>
        </div>

        <AnimatedTabs<FavoritesTab> value={tab} options={TAB_OPTIONS} onValueChange={handleTabChange} />
      </div>

      {tab === "products" ? <FavoriteProductsTab /> : <FavoriteSuppliersPage embedded />}
    </section>
  )
}
