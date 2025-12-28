"use client"

import {
  Box,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Heart,
  LayoutGrid,
  List,
  Scale,
  ShieldCheck,
  Star,
  Truck,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { getFullImageUrl } from "@/lib/api/products"
import BrandFilter from "./BrandFilter"
import ManufacturerFilter from "./ManufacturerFilter"
import RatingFilter from "./RatingFilter"

interface APIProduct {
  productId: string
  productName: string
  brand: string
  barcode: string
  coverPhotoPath: string
  manufacturerCode: string
  reorderId: string
  referanceNumber: string
  overallStar: number
  reviewCount: number
  vendorsCount: number
  bestPriceVendor: string
  price: number
  oldPrice: number
  discount: number
  stock: number
}

interface ProductListingClientProps {
  initialProducts: APIProduct[]
  totalElements: number
  brands: string[]
  manufacturers: string[]
  currentPage: number
  pageSize: number
  totalPages: number
}

const FilterContent = ({ brands, manufacturers }: { brands: string[]; manufacturers: string[] }) => (
  <>
    {/* Active Filters */}
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Active Filters</h3>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-steel-blue text-white">
          In Stock
          <button type="button" className="ml-2 text-white/80 hover:text-white" onClick={() => {}}>
            <X className="w-3 h-3" />
          </button>
        </span>
      </div>
    </div>

    <BrandFilter brands={brands} />
    <ManufacturerFilter manufacturers={manufacturers} />

    {/* Price Filter */}
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Price Range</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Min
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-sm"
                />
              </div>
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Max
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="1000"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-sm"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: "Under $50", range: "0-50", count: 234 },
            { label: "$50 - $200", range: "50-200", count: 567 },
            { label: "$200 - $500", range: "200-500", count: 345 },
            { label: "$500 - $1,000", range: "500-1000", count: 123 },
            { label: "Over $1,000", range: "1000+", count: 89 },
          ].map((option) => (
            <label key={option.range} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="priceRange"
                className="form-radio text-steel-blue h-4 w-4 rounded border-gray-300 focus:ring-steel-blue"
              />
              <span className="ml-3 text-sm text-gray-700 group-hover:text-steel-blue transition-colors">
                {option.label}
              </span>
              <span className="ml-auto text-xs text-gray-500">({option.count})</span>
            </label>
          ))}
        </div>
      </div>
    </div>

    {/* Availability */}
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-steel-blue mb-4">Availability</h3>
      <div className="space-y-3">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            className="form-checkbox text-steel-blue h-4 w-4 rounded border-gray-300 focus:ring-steel-blue"
            defaultChecked
          />
          <span className="ml-3 text-sm text-gray-700 group-hover:text-steel-blue transition-colors">In Stock</span>
        </label>
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            className="form-checkbox text-steel-blue h-4 w-4 rounded border-gray-300 focus:ring-steel-blue"
          />
          <span className="ml-3 text-sm text-gray-700 group-hover:text-steel-blue transition-colors">Ships Today</span>
        </label>
      </div>
    </div>

    <RatingFilter />
  </>
)

const ProductListingClient = ({
  initialProducts,
  totalElements,
  brands,
  manufacturers,
  currentPage,
  pageSize,
  totalPages,
}: ProductListingClientProps) => {
  const [viewType, setViewType] = useState<"grid" | "list">("grid")
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/products?${params.toString()}`)
  }

  const handleSizeChange = (size: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("size", size)
    params.set("page", "1")
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="bg-light-mint-gray min-h-screen font-inter">
      {/* Mobile Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm w-full h-full cursor-default"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-steel-blue">Filters</h2>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 text-gray-400 hover:text-steel-blue transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <FilterContent brands={brands} manufacturers={manufacturers} />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full bg-steel-blue text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
              >
                Show {totalElements} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <section className="bg-white border-b border-gray-200 py-3">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-steel-blue hover:underline">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link href="/categories" className="text-steel-blue hover:underline">
              Categories
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-600">All Products</span>
          </div>
        </div>
      </section>

      {/* Page Header */}
      <section className="bg-white py-8">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl font-bold text-steel-blue mb-2">Dental Products</h1>
              <p className="text-lg text-gray-600">Quality dental supplies and equipment from verified vendors</p>
              <div className="flex flex-wrap items-center mt-4 gap-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Box className="w-4 h-4 mr-2 text-steel-blue" />
                  <span>{totalElements} products available</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="w-4 h-4 mr-2 text-steel-blue" />
                  <span>Fast shipping available</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 mr-2 text-steel-blue" />
                  <span>FDA certified products</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-semibold flex items-center transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Catalog
              </button>
              <button
                type="button"
                className="border border-steel-blue text-steel-blue px-6 py-3 rounded-lg hover:bg-steel-blue hover:text-white transition-all font-semibold flex items-center"
              >
                <Heart className="w-4 h-4 mr-2" />
                Save Category
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Sort Bar */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden bg-steel-blue text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-md active:scale-95 transition-all"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  type="button"
                  onClick={() => setViewType("grid")}
                  className={`p-2 rounded ${viewType === "grid" ? "bg-steel-blue text-white" : "text-gray-400 hover:text-steel-blue"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewType("list")}
                  className={`p-2 rounded ${viewType === "list" ? "bg-steel-blue text-white" : "text-gray-400 hover:text-steel-blue"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Items per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-steel-blue bg-white"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-steel-blue bg-white">
                  <option>Best Match</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                  <option>Most Popular</option>
                  <option>Best Rating</option>
                  <option>Brand A-Z</option>
                </select>
              </div>
              <button type="button" className="text-sm text-steel-blue hover:underline flex items-center">
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-68 shrink-0">
            <div
              style={{ maxHeight: "calc(100vh - 4rem)" }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto sticky top-8 custom-scrollbar"
            >
              <FilterContent brands={brands} manufacturers={manufacturers} />
            </div>
          </aside>

          {/* Main Product Grid */}
          <main className="flex-1">
            {/* Results Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-steel-blue mb-2">{totalElements} Products Found</h2>
                  <p className="text-gray-600">Showing all dental products from our marketplace</p>
                </div>
              </div>
            </div>

            {/* Featured Banner */}
            <div className="bg-linear-to-r from-steel-blue to-blue-700 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Featured Surgical Kits</h3>
                <p className="text-blue-100 mb-6 max-w-lg">
                  Complete instrument sets from top manufacturers. Save up to 20% on bundled purchases.
                </p>
                <button
                  type="button"
                  className="bg-pale-lime text-steel-blue px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
                >
                  View Featured Kits
                </button>
              </div>
              <Box className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white/10 rotate-12" />
            </div>

            {/* Product Grid */}
            <div
              className={
                viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8" : "space-y-6 mb-8"
              }
            >
              {initialProducts.map((product) => (
                <div
                  key={product.productId}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group ${viewType === "list" ? "shrink-0 flex" : ""}`}
                >
                  <div className={`relative bg-light-mint-gray ${viewType === "list" ? "w-64 shrink-0" : "h-64"}`}>
                    {product.coverPhotoPath ? (
                      <Image
                        src={getFullImageUrl(product.coverPhotoPath)}
                        alt={product.productName}
                        fill
                        className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-steel-blue text-center p-6 font-semibold flex items-center justify-center h-full w-full">
                        No photo available
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 right-4">
                      <div
                        className={`px-2 py-1 rounded text-xs font-bold flex items-center shadow-sm ${product.stock > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-1.5 ${product.stock > 0 ? "bg-green-500" : "bg-gray-500"}`}
                        />
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="text-xs font-bold text-steel-blue bg-steel-blue/10 px-2 py-1 rounded uppercase tracking-wider">
                        {product.brand || "Generic"}
                      </span>
                      <h3 className="text-lg font-bold text-steel-blue mt-2 mb-1 group-hover:text-blue-700 transition-colors">
                        <Link href={`/products/${product.productId}`}>{product.productName}</Link>
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        High-quality product from {product.brand || "verified supplier"}
                      </p>
                    </div>

                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400 mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Math.floor(product.overallStar) ? "fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {product.overallStar} ({product.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-2xl font-bold text-steel-blue">${product.price.toFixed(2)}</span>
                          {product.oldPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through ml-2">
                              ${product.oldPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.oldPrice > product.price && (
                          <div className="text-sm text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                            Save {Math.round((1 - product.price / product.oldPrice) * 100)}%
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                        <Truck className="w-3.5 h-3.5 text-steel-blue mr-2" />
                        <span>Free shipping available</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="flex-1 bg-steel-blue text-white py-2.5 rounded-xl hover:bg-opacity-90 font-bold text-sm transition-all shadow-md active:scale-95"
                        >
                          Add to Cart
                        </button>
                        <Link
                          href={`/products/${product.productId}`}
                          className="w-11 h-11 border border-steel-blue/30 text-steel-blue rounded-xl hover:bg-steel-blue hover:text-white transition-all flex items-center justify-center"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          type="button"
                          className="w-11 h-11 border border-gray-200 text-gray-400 rounded-xl hover:border-steel-blue hover:text-steel-blue transition-all flex items-center justify-center"
                        >
                          <Scale className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-bold text-steel-blue">
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalElements)}
                </span>{" "}
                of <span className="font-bold text-steel-blue">{totalElements}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-steel-blue disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNumber = i + 1
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === pageNumber
                          ? "bg-steel-blue text-white shadow-md"
                          : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-steel-blue disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ProductListingClient
