"use client"

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Edit, Search, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
import AnimatedTabs from "@/components/ui/animated-tabs"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFullImageUrl, type Product, productsAPI, type UserProduct } from "@/lib/api/products"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidthClassName="max-w-md"
      overlayClassName="bg-brand-strong/40 backdrop-blur-[2px]"
      contentClassName="rounded-2xl border border-border-soft bg-surface-elevated p-0"
    >
      <div className="p-6">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mb-6 text-text-secondary">{message}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-lg px-4">
            {cancelText}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} className="rounded-lg px-4">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface ProductWithDetails extends UserProduct {
  product?: Product
  image?: string
}

type PeriodTab = "3 months" | "6 months" | "12 months"

const PERIOD_TABS: ReadonlyArray<{ label: string; value: PeriodTab }> = [
  { label: "3 months", value: "3 months" },
  { label: "6 months", value: "6 months" },
  { label: "12 months", value: "12 months" },
]

export default function ProductsPage() {
  const id = useId()
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<"price" | "stock" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("TOTAL")
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<PeriodTab>("3 months")
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
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
        return "border border-success/20 bg-success/14 text-success"
      case "Inactive":
        return "border border-warning/20 bg-warning/14 text-warning"
      case "Archived":
        return "border border-border-soft bg-surface-muted text-text-primary"
      default:
        return "border border-border-soft bg-surface-muted text-text-primary"
    }
  }

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-danger"
    if (stock < 20) return "text-warning"
    return "text-success"
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Please log in to view your products.</p>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <section id={`${id}-page-header`} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Product Management</h1>
            <p className="text-text-secondary mt-1">Manage your entire product catalog, inventory, and pricing</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button type="button" variant="outline" className="rounded-lg px-4 font-medium">
              <Download className="mr-2 w-4 h-4" />
              Export
            </Button>
            <Button type="button" variant="secondary" className="rounded-lg px-4 font-medium dark:text-neutral-800">
              <Upload className="mr-2 w-4 h-4" />
              Import CSV
            </Button>
            <Link
              href="/vendor-dashboard/products/create"
              className="flex items-center rounded-lg bg-brand px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
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
      <section
        id={`${id}-filters-section`}
        className="mb-6 rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-lg flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-border-strong py-2 pl-10 pr-4 text-text-primary placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <Search className="absolute left-3 top-3 text-text-muted w-4 h-4" />
            </div>
          </div>

          <AnimatedTabs<PeriodTab>
            value={selectedPeriodTab}
            options={PERIOD_TABS}
            onValueChange={setSelectedPeriodTab}
            className="self-start lg:self-auto"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-border-soft text-sm text-text-secondary">
          <div className="text-sm text-text-secondary">
            Showing{" "}
            <span className="font-semibold text-brand">
              {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)}
            </span>{" "}
            of <span className="font-semibold text-brand">{totalElements}</span> products
          </div>
        </div>
      </section>

      {/* Products Table */}
      <section
        id={`${id}-products-table-section`}
        className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border-soft bg-surface-muted/70">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-brand bg-surface-muted border-border-strong rounded focus:ring-brand/40"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleSort("price")}
                    className="flex items-center space-x-1 hover:text-brand transition-colors"
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
                        <ArrowUp className="w-3 h-3 text-text-muted" />
                        <ArrowDown className="w-3 h-3 text-text-muted" />
                      </div>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => handleSort("stock")}
                    className="flex items-center space-x-1 hover:text-brand transition-colors"
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
                        <ArrowUp className="w-3 h-3 text-text-muted" />
                        <ArrowDown className="w-3 h-3 text-text-muted" />
                      </div>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-muted">
                    No products found. Create your first product!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-surface-muted/80">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 text-brand bg-surface-muted border-border-strong rounded focus:ring-brand/40"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center min-w-72">
                        <div className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 overflow-hidden bg-surface-elevated rounded-lg border border-border-soft flex items-center justify-center mr-3">
                          <Image
                            src={
                              imageFallbacks[product.id] || !product.image
                                ? "/dentypro-product-placeholder.png"
                                : product.image
                            }
                            alt={product.productName}
                            width={40}
                            height={40}
                            className={cn(
                              "w-full h-full object-contain",
                              imageFallbacks[product.id] || !product.image ? "scale-110" : "",
                            )}
                            onError={() =>
                              setImageFallbacks((prev) => ({
                                ...prev,
                                [product.id]: true,
                              }))
                            }
                          />
                        </div>
                        <div className="font-medium text-text-primary">{product.productName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{product.product?.subCategoriesId || "-"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${getStockColor(product.stock)}`}>{product.stock}</span>
                        <span className="ml-2 text-xs text-text-muted">units</span>
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
                    <td className="px-6 py-4 text-sm text-text-secondary">-</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product.id)}
                          className="rounded-lg p-2 text-brand transition-colors hover:bg-surface-muted"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.productName)}
                          className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
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
        <div className="border-t border-border-soft bg-surface-muted px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Show</span>
              <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="h-9 w-24 rounded-lg border-border-strong bg-surface-elevated px-3 py-1 text-sm text-text-secondary shadow-none focus-visible:ring-2 focus-visible:ring-brand/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-text-secondary">per page</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
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
                        ? "bg-brand text-white"
                        : "border border-border-strong hover:bg-surface-elevated text-text-secondary"
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                )
              })}

              {totalPages > 5 && currentPage < totalPages - 3 && (
                <>
                  <span className="px-2 text-text-muted">...</span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages - 1)}
                    className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null, productName: "" })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  )
}
