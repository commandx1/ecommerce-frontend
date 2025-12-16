"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/authStore"

interface ProductStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  outOfStockProducts: number
  lowStockProducts: number
}

export type FilterType = "ALL" | "TOTAL" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "LOW_STOCK"

interface ProductStatsCardsProps {
  selectedFilter?: FilterType
  onFilterChange?: (filter: FilterType) => void
}

const ProductStatsCards = ({ selectedFilter = "TOTAL", onFilterChange }: ProductStatsCardsProps) => {
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { accessToken, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken])

  const fetchStats = async () => {
    if (!accessToken) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/user-products/stats", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch product stats")
      }

      const data: ProductStats = await response.json()
      setStats(data)
    } catch (err) {
      console.warn("Error fetching product stats:", err)
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {["total", "active", "low-stock", "out-of-stock", "inactive"].map((type) => (
          <div
            key={`loading-${type}`}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="col-span-full bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-red-800 text-sm">{error || "Failed to load product statistics"}</div>
        </div>
      </div>
    )
  }

  const handleCardClick = (filter: FilterType) => {
    if (onFilterChange) {
      onFilterChange(filter)
    }
  }

  const getCardClasses = (filter: FilterType) => {
    const baseClasses =
      "bg-white rounded-xl p-4 shadow-sm border transition-all cursor-pointer hover:shadow-md text-left w-full"
    const selectedClasses = selectedFilter === filter ? "border-steel-blue border-2 shadow-md" : "border-gray-100"
    return `${baseClasses} ${selectedClasses}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Products */}
      <button type="button" onClick={() => handleCardClick("TOTAL")} className={getCardClasses("TOTAL")}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Total Products"
            >
              <title>Total Products</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-steel-blue">{stats.totalProducts}</div>
        <div className="text-sm text-gray-600">Total Products</div>
      </button>

      {/* Active Products */}
      <button type="button" onClick={() => handleCardClick("ACTIVE")} className={getCardClasses("ACTIVE")}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Active Products"
            >
              <title>Active Products</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-steel-blue">{stats.activeProducts}</div>
        <div className="text-sm text-gray-600">Active Products</div>
      </button>

      {/* Low Stock Products */}
      <button type="button" onClick={() => handleCardClick("LOW_STOCK")} className={getCardClasses("LOW_STOCK")}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Low Stock Products"
            >
              <title>Low Stock Products</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-steel-blue">{stats.lowStockProducts}</div>
        <div className="text-sm text-gray-600">Low Stock</div>
      </button>

      {/* Out of Stock Products */}
      <button type="button" onClick={() => handleCardClick("OUT_OF_STOCK")} className={getCardClasses("OUT_OF_STOCK")}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Out of Stock Products"
            >
              <title>Out of Stock Products</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-steel-blue">{stats.outOfStockProducts}</div>
        <div className="text-sm text-gray-600">Out of Stock</div>
      </button>

      {/* Inactive Products */}
      <button type="button" onClick={() => handleCardClick("INACTIVE")} className={getCardClasses("INACTIVE")}>
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-label="Inactive Products"
            >
              <title>Inactive Products</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold text-steel-blue">{stats.inactiveProducts}</div>
        <div className="text-sm text-gray-600">Inactive</div>
      </button>
    </div>
  )
}

export default ProductStatsCards
