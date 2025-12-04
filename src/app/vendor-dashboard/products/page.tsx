"use client"

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Filter,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getFullImageUrl, type Product, productsAPI, type UserProduct } from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"
import VendorHeader from "../components/VendorHeader"
import VendorSidebar from "../components/VendorSidebar"

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

const categories = [
  "All Categories",
  "Composite Materials",
  "Surgical Equipment",
  "Orthodontic Supplies",
  "Diagnostic Tools",
  "Dental Instruments",
]

const statuses = ["All Status", "Published", "Inactive", "Archived"]

const stockStatuses = ["Stock Status", "In Stock", "Low Stock", "Out of Stock"]

export default function ProductsPage() {
  const router = useRouter()
  const { accessToken, isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedStockStatus, setSelectedStockStatus] = useState("Stock Status")
  const [sortField, setSortField] = useState<"price" | "stock" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
    isOpen: false,
    productId: null,
    productName: "",
  })

  // Fetch products
  const fetchProducts = async () => {
    if (!accessToken || !isAuthenticated) return

    try {
      setIsLoading(true)
      const userProducts = await productsAPI.getUserProducts(accessToken)

      // Fetch product details for each user product
      const productsWithDetails: ProductWithDetails[] = await Promise.all(
        userProducts.map(async (userProduct) => {
          try {
            const product = await productsAPI.getProductById(userProduct.productId, accessToken)
            const image = product.coverPhotoPath ? getFullImageUrl(product.coverPhotoPath) : undefined
            return {
              ...userProduct,
              product,
              image,
            }
          } catch (error) {
            console.error(`Error fetching product ${userProduct.productId}:`, error)
            return {
              ...userProduct,
              product: undefined,
              image: undefined,
            }
          }
        }),
      )

      setProducts(productsWithDetails)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to re-run this effect>
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchProducts()
    }
  }, [isAuthenticated, accessToken])

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleSelectAll = () => {
    const sorted = getSortedProducts()
    if (selectedProducts.length === sorted.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(sorted.map((p) => p.id))
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

  // Get sorted products
  const getSortedProducts = () => {
    if (!sortField) return products

    return [...products].sort((a, b) => {
      if (sortField === "price") {
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price
      }

      if (sortField === "stock") {
        return sortDirection === "asc" ? a.stock - b.stock : b.stock - a.stock
      }

      return 0
    })
  }

  const sortedProducts = getSortedProducts()

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
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
                <div className="text-2xl font-bold text-steel-blue">{products.length}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Published"
                    >
                      <title>Published</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-steel-blue">{products.filter((p) => p.active).length}</div>
                <div className="text-sm text-gray-600">Published</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Low Stock"
                    >
                      <title>Low Stock</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-steel-blue">
                  {products.filter((p) => p.stock > 0 && p.stock < 20).length}
                </div>
                <div className="text-sm text-gray-600">Low Stock</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Out of Stock"
                    >
                      <title>Out of Stock</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-steel-blue">{products.filter((p) => p.stock === 0).length}</div>
                <div className="text-sm text-gray-600">Out of Stock</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="Inactive"
                    >
                      <title>Inactive</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-steel-blue">{products.filter((p) => !p.active).length}</div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
            </div>
          </section>

          {/* Filters and Search */}
          <section id="filters-section" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products by name, SKU, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                </div>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                >
                  {stockStatuses.map((stockStatus) => (
                    <option key={stockStatus} value={stockStatus}>
                      {stockStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-medium flex items-center justify-center"
                >
                  <Filter className="mr-2 w-4 h-4" />
                  Apply Filters
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-steel-blue">1-{sortedProducts.length}</span> of{" "}
                <span className="font-semibold text-steel-blue">{sortedProducts.length}</span> products
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
                        checked={selectedProducts.length === sortedProducts.length && sortedProducts.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-steel-blue bg-gray-100 border-gray-300 rounded focus:ring-steel-blue"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      SKU
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
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        Loading products...
                      </td>
                    </tr>
                  ) : sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        No products found. Create your first product!
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((product) => (
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
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.product?.barcode ? String(product.product.barcode) : "-"}
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
                  <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-steel-blue focus:border-transparent">
                    <option>25</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button type="button" className="px-3 py-2 bg-steel-blue text-white rounded-lg text-sm font-medium">
                    1
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700"
                  >
                    2
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700"
                  >
                    3
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700"
                  >
                    50
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white text-sm font-medium text-gray-700"
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
