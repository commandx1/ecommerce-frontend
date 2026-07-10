"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Download, Edit, Loader2, Search, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import AnimatedTabs from "@/components/ui/animated-tabs"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import Modal from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFullImageUrl, type Product, productsAPI, type UserProduct, type UserProductSortBy } from "@/lib/api/products"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import ImportDocumentsModal from "./components/ImportDocumentsModal"
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

type ProductStatusDraft = "active" | "inactive"
type PeriodTab = "3 months" | "6 months" | "12 months"

const PERIOD_TABS: ReadonlyArray<{ label: string; value: PeriodTab }> = [
  { label: "3 months", value: "3 months" },
  { label: "6 months", value: "6 months" },
  { label: "12 months", value: "12 months" },
]

const PERIOD_TAB_TO_DAY_COUNT: Record<PeriodTab, number> = {
  "3 months": 90,
  "6 months": 180,
  "12 months": 365,
}

const VALID_FILTER_TYPES: FilterType[] = ["ALL", "TOTAL", "ACTIVE", "INACTIVE", "OUT_OF_STOCK", "LOW_STOCK"]

export default function ProductsPage() {
  const id = useId()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const hasLoadedOnce = useRef(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<UserProductSortBy | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(() => {
    const filterParam = searchParams.get("filter")
    return VALID_FILTER_TYPES.includes(filterParam as FilterType) ? (filterParam as FilterType) : "TOTAL"
  })
  const selectedUserProductId = searchParams.get("userProductId")
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<PeriodTab>("3 months")
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<{ price: string; stock: string; active: ProductStatusDraft } | null>(null)
  const [savingProductId, setSavingProductId] = useState<string | null>(null)
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
    isOpen: false,
    productId: null,
    productName: "",
  })

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Fetch products
  const fetchProducts = async () => {
    if (!accessToken || !isAuthenticated) {
      setIsLoading(false)
      setIsFetching(false)
      return
    }

    try {
      if (!hasLoadedOnce.current) {
        setIsLoading(true)
      } else {
        setIsFetching(true)
      }

      let productsWithDetails: UserProduct[] = []

      try {
        const howManySoldDay = PERIOD_TAB_TO_DAY_COUNT[selectedPeriodTab]
        const activeSortBy: UserProductSortBy = sortField ?? "STOCK"
        const activeSortDir = sortField ? sortDirection : "asc"

        const filterResponse = await productsAPI.filterUserProducts(
          accessToken,
          selectedFilter === "ALL" ? "TOTAL" : selectedFilter,
          currentPage,
          pageSize,
          activeSortBy,
          activeSortDir,
          debouncedSearchQuery,
          howManySoldDay,
          selectedUserProductId ?? undefined,
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
      hasLoadedOnce.current = true
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
      setIsFetching(false)
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
    selectedUserProductId,
    sortField,
    sortDirection,
    pageSize,
    currentPage,
    debouncedSearchQuery,
    selectedPeriodTab,
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

  const handleSort = (field: UserProductSortBy) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleInlineEditStart = (product: ProductWithDetails) => {
    setEditingProductId(product.id)
    setEditingDraft({
      price: String(product.price),
      stock: String(product.stock),
      active: product.active ? "active" : "inactive",
    })
  }

  const handleInlineEditSave = async (product: ProductWithDetails) => {
    if (!accessToken || !editingDraft) return

    const nextPrice = Number.parseFloat(editingDraft.price)
    const nextStock = Number.parseInt(editingDraft.stock, 10)
    const nextActive = editingDraft.active === "active"

    if (!Number.isFinite(nextPrice) || nextPrice < 0 || !Number.isInteger(nextStock) || nextStock < 0) {
      return
    }

    try {
      setSavingProductId(product.id)
      const updatedProduct = await productsAPI.updateUserProduct(
        product.id,
        {
          price: nextPrice,
          stock: nextStock,
          discount: product.discount,
          active: nextActive,
        },
        accessToken,
      )

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, ...updatedProduct, active: nextActive, productName: updatedProduct.productName }
            : item,
        ),
      )
      setEditingProductId(null)
      setEditingDraft(null)
    } catch (error) {
      console.error("Error updating product:", error)
    } finally {
      setSavingProductId(null)
    }
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
      case "Active":
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const productColumns: Array<ColumnDef<ProductWithDetails, unknown>> = [
    {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={selectedProducts.length === products.length && products.length > 0}
          onChange={handleSelectAll}
          className="w-4 h-4 text-brand bg-surface-muted border-border-strong rounded focus:ring-brand/40"
          aria-label="Select all products"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedProducts.includes(row.original.id)}
          onChange={() => handleSelectProduct(row.original.id)}
          className="w-4 h-4 text-brand bg-surface-muted border-border-strong rounded focus:ring-brand/40"
          aria-label={`Select ${row.original.productName}`}
        />
      ),
      meta: {
        headerClassName: "w-14 px-6 py-4",
        cellClassName: "px-6 py-4",
      },
    },
    {
      id: "product",
      header: () => "Product",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center min-w-72">
            <div className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 overflow-hidden bg-surface-elevated rounded-lg border border-border-soft flex items-center justify-center mr-3">
              <Image
                src={imageFallbacks[product.id] || !product.image ? "/dentypro-product-placeholder.png" : product.image}
                alt={product.productName}
                width={40}
                height={40}
                className={cn("w-full h-full object-contain", imageFallbacks[product.id] || !product.image ? "scale-110" : "")}
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
        )
      },
      meta: {
        headerClassName: "w-80 px-6 py-4",
        cellClassName: "px-6 py-4",
      },
    },
    {
      id: "price",
      header: () => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleSort("PRICE")}
            className="flex items-center space-x-1 hover:text-brand transition-colors"
          >
            <span>Price</span>
            {sortField === "PRICE" ? (
              sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
            ) : (
              <div className="flex flex-col -space-y-1.5 w-4 h-4">
                <ArrowUp className="w-3 h-3 text-text-muted" />
                <ArrowDown className="w-3 h-3 text-text-muted" />
              </div>
            )}
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const product = row.original
        const isEditing = editingProductId === product.id
        const isSaving = savingProductId === product.id
        const draftPrice = editingDraft?.price ?? ""

        return (
          <div className="text-sm font-semibold text-brand">
            {isEditing ? (
              <input
                type="number"
                min={0}
                step="0.01"
                value={draftPrice}
                onChange={(event) =>
                  setEditingDraft((prev) => (prev ? { ...prev, price: event.target.value } : prev))
                }
                className="h-9 w-28 rounded-lg border border-border-strong bg-surface px-3 text-sm font-semibold text-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
                disabled={isSaving}
              />
            ) : (
              `$${product.price.toFixed(2)}`
            )}
          </div>
        )
      },
      meta: {
        headerClassName: "border-l-2 border-border-soft px-6 py-4 text-center",
        cellClassName: "border-l-2 border-border-soft px-6 py-4 text-center",
      },
    },
    {
      id: "stock",
      header: () => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleSort("STOCK")}
            className="flex items-center space-x-1 hover:text-brand transition-colors"
          >
            <span>Stock</span>
            {sortField === "STOCK" ? (
              sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
            ) : (
              <div className="flex flex-col -space-y-1.5 w-4 h-4">
                <ArrowUp className="w-3 h-3 text-text-muted" />
                <ArrowDown className="w-3 h-3 text-text-muted" />
              </div>
            )}
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const product = row.original
        const isEditing = editingProductId === product.id
        const isSaving = savingProductId === product.id
        const draftStock = editingDraft?.stock ?? ""

        return isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={draftStock}
              onChange={(event) =>
                setEditingDraft((prev) => (prev ? { ...prev, stock: event.target.value } : prev))
              }
              className="h-9 w-24 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
              disabled={isSaving}
            />
            <span className="text-xs text-text-muted">units</span>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <span className={`text-sm font-medium ${getStockColor(product.stock)}`}>{product.stock}</span>
            <span className="ml-2 text-xs text-text-muted">units</span>
          </div>
        )
      },
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "periodicSellCount",
      header: () => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleSort("PERIODIC_SELL_COUNT")}
            className="flex items-center space-x-1 hover:text-brand transition-colors"
          >
            <span>Qty Sold</span>
            {sortField === "PERIODIC_SELL_COUNT" ? (
              sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
            ) : (
              <div className="flex flex-col -space-y-1.5 w-4 h-4">
                <ArrowUp className="w-3 h-3 text-text-muted" />
                <ArrowDown className="w-3 h-3 text-text-muted" />
              </div>
            )}
          </button>
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-text-secondary">{row.original.periodicSellCount?.toLocaleString("en-US") ?? 0}</span>
      ),
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "periodicGrossRevenue",
      header: () => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleSort("PERIODIC_GROSS_REVENUE")}
            className="flex items-center space-x-1 hover:text-brand transition-colors"
          >
            <span>Sales</span>
            {sortField === "PERIODIC_GROSS_REVENUE" ? (
              sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
            ) : (
              <div className="flex flex-col -space-y-1.5 w-4 h-4">
                <ArrowUp className="w-3 h-3 text-text-muted" />
                <ArrowDown className="w-3 h-3 text-text-muted" />
              </div>
            )}
          </button>
        </div>
      ),
      cell: ({ row }) => {
        const periodicGrossRevenue = row.original.periodicGrossRevenue ?? 0
        return <span className="text-sm font-medium text-text-primary">{formatCurrency(periodicGrossRevenue)}</span>
      },
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const product = row.original
        const isEditing = editingProductId === product.id
        const isSaving = savingProductId === product.id
        const draftActive = editingDraft?.active ?? (product.active ? "active" : "inactive")

        return isEditing ? (
          <Select
            value={draftActive}
            onValueChange={(value) =>
              setEditingDraft((prev) =>
                prev ? { ...prev, active: value === "active" ? "active" : "inactive" } : prev,
              )
            }
            disabled={isSaving}
          >
            <SelectTrigger className="h-9 w-32 rounded-lg border-border-strong bg-surface-elevated px-3 text-sm shadow-none focus:ring-2 focus:ring-brand/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(product.active ? "Active" : "Inactive")}`}
          >
            {product.active ? "Active" : "Inactive"}
          </span>
        )
      },
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const product = row.original
        const isEditing = editingProductId === product.id
        const isSaving = savingProductId === product.id
        const draftPrice = editingDraft?.price ?? ""
        const draftStock = editingDraft?.stock ?? ""
        const parsedDraftPrice = Number.parseFloat(draftPrice)
        const parsedDraftStock = Number.parseInt(draftStock, 10)
        const canSaveDraft =
          Number.isFinite(parsedDraftPrice) &&
          parsedDraftPrice >= 0 &&
          Number.isInteger(parsedDraftStock) &&
          parsedDraftStock >= 0

        return (
          <div className="flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={() => (isEditing ? void handleInlineEditSave(product) : handleInlineEditStart(product))}
              disabled={isSaving || (isEditing && !canSaveDraft)}
              className="rounded-lg p-2 text-brand transition-colors hover:bg-surface-muted disabled:opacity-50"
              title={isEditing ? "Save" : "Edit"}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <Check className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(product.id, product.productName)}
              disabled={isSaving}
              className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
  ]

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
            <Button
              type="button"
              variant="secondary"
              className="rounded-lg px-4 font-medium dark:text-neutral-800"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="mr-2 w-4 h-4" />
              Import Products
            </Button>
            <Button asChild className="rounded-lg px-4 font-medium">
              <Link href="/vendor-dashboard/products/create">
                <span className="mr-2">+</span>
                Add New Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <ProductStatsCards selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />

      </section>

      {/* Products Table + Filters */}
      <section
        id={`${id}-products-table-section`}
        className="mb-6 overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
      >
        <div className="border-b border-border-soft p-6">
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
              disabled={isLoading || isFetching}
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
        </div>

        <div className={cn("overflow-x-auto transition-opacity duration-150", isFetching && "opacity-50", isFetching && !editingProductId && "pointer-events-none")}>
          <DataTable
            columns={productColumns}
            data={products}
            getRowClassName={() => "transition-colors hover:bg-surface-muted/80"}
            getRowId={(product) => product.id}
            isLoading={isLoading}
            loadingText="Loading products..."
            minTableWidthClassName="min-w-[1320px]"
            noRowsText="No products found. Create your first product!"
          />
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

      <ImportDocumentsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

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
