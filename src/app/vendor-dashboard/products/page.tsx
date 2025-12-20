"use client"

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Edit, Search, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getFullImageUrl, type Product, productsAPI, type UserProduct } from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"
import VendorHeader from "../components/VendorHeader"
import VendorSidebar from "../components/VendorSidebar"
import ProductStatsCards, { type FilterType } from "./components/ProductStatsCards"

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
}: ConfirmationModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-steel-blue mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProductWithDetails extends UserProduct {
  product?: Product
  image?: string
}

export default function ProductsPage() {
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"price" | "stock" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("TOTAL")
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
    isOpen: false,
    productId: null,
    productName: "",
  })

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Fetch products
  const fetchProducts = async () => {
    if (!accessToken || !isAuthenticated) return

    try {
      setIsLoading(true)
      const userProducts: UserProduct[] = []

      // Prepare sort parameters
      const sortParams: { price?: boolean; stock?: boolean } = {}
      if (sortField === "price") {
        sortParams.price = sortDirection === "desc" // Reverse logic
      } else if (sortField === "stock") {
        sortParams.stock = sortDirection === "desc" // Reverse logic
      }

      // Default sort by stock asc if no sort is selected
      if (!sortField) {
        sortParams.stock = true
      }

      let productsWithDetails: UserProduct[] = []

      try {
        const filterResponse = await productsAPI.filterUserProducts(
          accessToken,
          selectedFilter === "ALL" ? "TOTAL" : selectedFilter,
          currentPage,
          pageSize,
          sortParams.price,
          sortParams.stock,
          debouncedSearchQuery,
        )

        const userProducts = filterResponse.content
        setTotalPages(filterResponse.totalPages)
        setTotalElements(filterResponse.totalElements)

        // Filter API already includes product details, no need for additional API calls
        productsWithDetails = userProducts.map((userProduct) => ({
          ...userProduct,
          product: {
            id: userProduct.productId,
            name: userProduct.productName || "",
            detailedName: userProduct.productName || "",
            barcode: "", // Not available in filter response
            barcodeFormats: "",
            active: userProduct.active,
            subCategoriesId: userProduct.subCategoriesId || "",
            coverPhotoPath: userProduct.coverPhotoPath,
            // Add other required Product fields with defaults
            aboutProduct: "",
            customerReviews: "",
            description: "",
            manufacturerCode: "",
            brand: "",
            packaging: "",
            primaryMarket: "",
            scent: "",
            size: "",
            type: "",
            sds: "",
            photoPaths: userProduct.coverPhotoPath,
            photoPhats: userProduct.coverPhotoPath ? [userProduct.coverPhotoPath] : [],
            createdDate: "",
            userId: userProduct.userId,
            reviewCount: 0,
            vendorsCount: 0,
            overallStar: 0,
          },
          image: userProduct.coverPhotoPath ? getFullImageUrl(userProduct.coverPhotoPath) : undefined,
        }))
      } catch (apiError: unknown) {
        // 403 veya 401 hatası kontrolü
        if (apiError && typeof apiError === "object" && "status" in apiError) {
          const errorStatus = (apiError as { status: number }).status
          if (errorStatus === 401 || errorStatus === 403) {
            const { logout } = useAuthStore.getState()
            await logout()
            router.push("/login")
            return // Component unmount olacak
          }
        }

        // Sadece gerçek hataları logla (boş objeleri değil)
        if (apiError && typeof apiError === "object") {
          const errorObj = apiError as Record<string, unknown>
          if (Object.keys(errorObj).length > 0 || errorObj.message) {
            console.error("API Error:", apiError)
          }
        } else if (apiError) {
          console.error("API Error:", apiError)
        }

        // Fallback to empty results
        setTotalPages(0)
        setTotalElements(0)
        productsWithDetails = []
      }

      setProducts(productsWithDetails)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter)
    setCurrentPage(0) // Reset to first page when filter changes
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(0) // Reset to first page when page size changes
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(0) // Reset to first page when search changes
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to re-run this effect>
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchProducts()
    }
  }, [
    isAuthenticated,
    accessToken,
    selectedFilter,
    sortField,
    sortDirection,
    pageSize,
    currentPage,
    debouncedSearchQuery,
  ])

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p) => p.id))
    }
  }

  // Handle sort
  const handleSort = (field: "price" | "stock") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Products are now sorted from API
  const sortedProducts = products

  const handleEdit = (userProductId: string) => {
    router.push(`/vendor-dashboard/products/create?edit=${userProductId}`)
  }

  const handleDelete = (userProductId: string, productName: string) => {
    setDeleteModal({
      isOpen: true,
      productId: userProductId,
      productName,
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal.productId || !accessToken) return

    try {
      await productsAPI.deleteUserProduct(deleteModal.productId, accessToken)
      setDeleteModal({ isOpen: false, productId: null, productName: "" })
      await fetchProducts() // Refresh the list
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-yellow-100 text-yellow-800"
      case "Archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600"
    if (stock < 20) return "text-yellow-600"
    return "text-green-600"
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to view your products.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-light-mint-gray">
      <VendorHeader />
      <div className="flex flex-1">
        <VendorSidebar />
        <main id="main-content" className="flex-1 p-8">
          {/* Page Header */}
          <section id="page-header" className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-steel-blue">Product Management</h1>
                <p className="text-gray-600 mt-1">Manage your entire product catalog, inventory, and pricing</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium flex items-center"
                >
                  <Download className="mr-2 w-4 h-4" />
                  Export
                </button>
                <button
                  type="button"
                  className="bg-pale-lime text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center"
                >
                  <Upload className="mr-2 w-4 h-4" />
                  Import CSV
                </button>
                <Link
                  href="/vendor-dashboard/products/create"
                  className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center"
                >
                  <span className="mr-2">+</span>
                  Add New Product
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <ProductStatsCards selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />
          </section>

          {/* Filters and Search */}
          <section id="filters-section" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products by name"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                />
                <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-steel-blue">
                  {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)}
                </span>{" "}
                of <span className="font-semibold text-steel-blue">{totalElements}</span> products
              </div>
            </div>
          </section>

          {/* Products Table */}
          <section
            id="products-table-section"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg- border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-steel-blue bg-gray-100 border-gray-300 rounded focus:ring-steel-blue"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSort("price")}
                        className="flex items-center space-x-1 hover:text-steel-blue transition-colors"
                      >
                        <span>Price</span>
                        {sortField === "price" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        ) : (
                          <div className="flex flex-col -space-y-1.5 w-4 h-4">
                            <ArrowUp className="w-3 h-3 text-gray-400" />
                            <ArrowDown className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSort("stock")}
                        className="flex items-center space-x-1 hover:text-steel-blue transition-colors"
                      >
                        <span>Stock</span>
                        {sortField === "stock" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        ) : (
                          <div className="flex flex-col -space-y-1.5 w-4 h-4">
                            <ArrowUp className="w-3 h-3 text-gray-400" />
                            <ArrowDown className="w-3 h-3 text-gray-400" />
                          </div>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        Loading products...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No products found. Create your first product!
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-light-mint-gray transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="w-4 h-4 text-steel-blue bg-gray-100 border-gray-300 rounded focus:ring-steel-blue"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center min-w-72">
                            <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center mr-3">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.productName}
                                  width={40}
                                  height={40}
                                  className="min-w-10 min-h-10 object-contain"
                                  unoptimized
                                />
                              ) : (
                                <svg
                                  className="w-6 h-6 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-label="Product placeholder"
                                >
                                  <title>Product placeholder</title>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="font-medium text-steel-blue">{product.productName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{product.product?.subCategoriesId || "-"}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-steel-blue">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${getStockColor(product.stock)}`}>
                              {product.stock}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">units</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                              product.active ? "Published" : "Inactive",
                            )}`}
                          >
                            {product.active ? "Published" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">-</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(product.id)}
                              className="p-2 text-steel-blue hover:bg-light-mint-gray rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id, product.productName)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 bg-light-mint-gray">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber: number
                    if (totalPages <= 5) {
                      pageNumber = i
                    } else if (currentPage < 3) {
                      pageNumber = i
                    } else if (currentPage > totalPages - 3) {
                      pageNumber = totalPages - 5 + i
                    } else {
                      pageNumber = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === pageNumber
                            ? "bg-steel-blue text-white"
                            : "border border-gray-300 hover:bg-white text-gray-700"
                        }`}
                      >
                        {pageNumber + 1}
                      </button>
                    )
                  })}

                  {totalPages > 5 && currentPage < totalPages - 3 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        type="button"
                        onClick={() => handlePageChange(totalPages - 1)}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null, productName: "" })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
