"use client"

import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  type BarcodeLookupProduct,
  type BarcodeProduct,
  type CreateProductData,
  type CreateUserProductPayload,
  getFullImageUrl,
  type NormalizedSearchProduct,
  type Product,
  productsAPI,
} from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"
import VendorHeader from "../../components/VendorHeader"
import VendorSidebar from "../../components/VendorSidebar"

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

interface FormData {
  // Product fields
  name: string
  detailedName: string
  aboutProduct: string
  subCategoriesId: string
  customerReviews: string
  barcode: string
  barcodeFormats: string
  active: boolean
  secureCode: string
  // Product Details fields
  description: string
  manufacturerCode: string
  brand: string
  packaging: string
  primaryMarket: string
  scent: string
  size: string
  type: string
  sds: string
  // User Product fields
  price: string
  discount: string
  stock: string
}

// For file uploads
interface FileData {
  coverPhoto: File | null
  coverPhotoPreview: string | null
  photos: File[]
  photosPreviews: string[]
}

const initialFormData: FormData = {
  name: "",
  detailedName: "",
  aboutProduct: "",
  subCategoriesId: "",
  customerReviews: "",
  barcode: "",
  barcodeFormats: "EAN_13",
  active: true,
  secureCode: "",
  description: "",
  manufacturerCode: "",
  brand: "",
  packaging: "",
  primaryMarket: "",
  scent: "",
  size: "",
  type: "",
  sds: "",
  price: "",
  discount: "",
  stock: "",
}

const initialFileData: FileData = {
  coverPhoto: null,
  coverPhotoPreview: null,
  photos: [],
  photosPreviews: [],
}

// For existing images from selected product (URLs, not files)
interface ExistingImages {
  coverPhoto: string | null
  photos: string[]
}

const barcodeFormatOptions = [
  { value: "EAN_13", label: "EAN-13" },
  { value: "EAN_8", label: "EAN-8" },
  { value: "UPC_A", label: "UPC-A" },
  { value: "UPC_E", label: "UPC-E" },
  { value: "CODE_128", label: "Code 128" },
  { value: "CODE_39", label: "Code 39" },
  { value: "QR_CODE", label: "QR Code" },
]

export default function CreateProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, isAuthenticated, user } = useAuthStore()

  const editUserProductId = searchParams.get("edit")
  const [isEditMode] = useState(!!editUserProductId)
  const [userProductId] = useState<string | null>(editUserProductId)

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [fileData, setFileData] = useState<FileData>(initialFileData)
  const [existingImages, setExistingImages] = useState<ExistingImages>({ coverPhoto: null, photos: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "media">("basic")
  const [isProductSelected, setIsProductSelected] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<NormalizedSearchProduct | null>(null)

  // File input refs
  const coverPhotoInputRef = useRef<HTMLInputElement>(null)
  const photosInputRef = useRef<HTMLInputElement>(null)

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<NormalizedSearchProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Show toast notification using sonner
  const showToast = useCallback((message: string, type: "error" | "success" = "error") => {
    if (type === "success") {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }, [])

  // Search function
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !accessToken) {
        setSearchResults([])
        setShowDropdown(false)
        return
      }

      setIsSearching(true)

      try {
        // Check if query looks like a barcode (only numbers)
        const isBarcode = /^\d+$/.test(query.trim())

        if (isBarcode) {
          // Search by barcode
          const result = await productsAPI.getProductByBarcode(query.trim(), accessToken)
          const normalized = productsAPI.normalizeBarcodeResult(result)
          setSearchResults([normalized])
        } else {
          // Search by title
          const response = await productsAPI.searchProductsByTitle(query.trim(), accessToken)
          const normalized = productsAPI.normalizeSearchResults(response)
          setSearchResults(normalized)
        }

        setShowDropdown(true)
      } catch (error) {
        showToast(`Search error: ${error}`, "error")
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [accessToken, showToast],
  )

  // Trigger search when debounced query changes
  useEffect(() => {
    performSearch(debouncedSearchQuery)
  }, [debouncedSearchQuery, performSearch])

  // Load product data in edit mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to re-run this effect>
  useEffect(() => {
    if (isEditMode && userProductId && accessToken) {
      loadProductForEdit()
    }
  }, [isEditMode, userProductId, accessToken])

  const loadProductForEdit = async () => {
    if (!userProductId || !accessToken) return

    try {
      setIsLoading(true)
      // First, get user-product to get productId and user-product fields
      const userProducts = await productsAPI.getUserProducts(accessToken)
      const userProduct = userProducts.find((up) => up.id === userProductId)

      if (!userProduct) {
        showToast("Product not found", "error")
        router.push("/vendor-dashboard/products")
        return
      }

      // Get product details
      const product = await productsAPI.getProductById(userProduct.productId, accessToken)

      // Populate form data
      setFormData({
        name: product.name || "",
        detailedName: product.detailedName || "",
        aboutProduct: product.aboutProduct || "",
        subCategoriesId: product.subCategoriesId || "",
        customerReviews: product.customerReviews || "",
        barcode: String(product.barcode),
        barcodeFormats: product.barcodeFormats || "EAN_13",
        active: userProduct.active,
        secureCode: "",
        description: product.description || "",
        manufacturerCode: product.manufacturerCode || "",
        brand: product.brand || "",
        packaging: product.packaging || "",
        primaryMarket: product.primaryMarket || "",
        scent: product.scent || "",
        size: product.size || "",
        type: product.type || "",
        sds: product.sds || "",
        price: String(userProduct.price),
        discount: String(userProduct.discount),
        stock: String(userProduct.stock),
      })

      // Load existing images
      const coverPhoto = product.coverPhotoPath ? getFullImageUrl(product.coverPhotoPath) : null
      const photos = product.photoPhats ? product.photoPhats.map(getFullImageUrl) : []

      setExistingImages({
        coverPhoto,
        photos,
      })

      // Disable form fields in edit mode
      setIsProductSelected(true)
    } catch (error) {
      showToast((error as { message?: string })?.message || "Failed to load product data", "error")
      router.push("/vendor-dashboard/products")
    } finally {
      setIsLoading(false)
    }
  }

  // Download image from URL and convert to File (using proxy to bypass CORS)
  const downloadImageAsFile = async (url: string, filename: string): Promise<File> => {
    try {
      // Use proxy endpoint to bypass CORS
      const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`)
      }
      const blob = await response.blob()
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" })
      return file
    } catch (error) {
      showToast((error as { message?: string })?.message || "Error downloading image", "error")
      throw error
    }
  }

  // Download images from URLs and set them as files
  const downloadAndSetImages = async (imageUrls: string[]) => {
    if (imageUrls.length === 0) {
      setFileData(initialFileData)
      setExistingImages({ coverPhoto: null, photos: [] })
      return
    }

    try {
      // Download cover photo (first image)
      const coverPhotoUrl = imageUrls[0]
      const coverPhotoFile = await downloadImageAsFile(coverPhotoUrl, `cover-${Date.now()}.jpg`)
      const coverPhotoPreview = URL.createObjectURL(coverPhotoFile)

      // Download additional photos
      const additionalPhotos: File[] = []
      const additionalPreviews: string[] = []

      for (let i = 1; i < imageUrls.length; i++) {
        const photoUrl = imageUrls[i]
        const photoFile = await downloadImageAsFile(photoUrl, `photo-${Date.now()}-${i}.jpg`)
        additionalPhotos.push(photoFile)
        additionalPreviews.push(URL.createObjectURL(photoFile))
      }

      setFileData({
        coverPhoto: coverPhotoFile,
        coverPhotoPreview,
        photos: additionalPhotos,
        photosPreviews: additionalPreviews,
      })

      // Clear existing images since we're using downloaded files
      setExistingImages({ coverPhoto: null, photos: [] })
    } catch (error) {
      showToast((error as { message?: string })?.message || "Error downloading images", "error")
      // On error, fallback to showing URLs as existing images
      setFileData(initialFileData)
      setExistingImages({
        coverPhoto: imageUrls[0] || null,
        photos: imageUrls.slice(1),
      })
    }
  }

  // Fill form with selected product data
  const handleProductSelect = async (product: NormalizedSearchProduct) => {
    const { originalData, source, images } = product

    // Mark that a product was selected (disable form inputs)
    setIsProductSelected(true)
    setSelectedProduct(product)

    // For barcode lookup products, download images and convert to files
    if (source === "barcode_lookup" && images.length > 0) {
      await downloadAndSetImages(images)
    } else {
      // For local products, use existing images as URLs
      if (images.length > 0) {
        setExistingImages({
          coverPhoto: images[0],
          photos: images.slice(1),
        })
      } else {
        setExistingImages({ coverPhoto: null, photos: [] })
      }
      // Clear any uploaded files since we're using existing images
      setFileData(initialFileData)
    }

    if (source === "barcode_lookup") {
      // Handle BarcodeLookupProduct or BarcodeProduct
      if ("barcode_number" in originalData) {
        const barcodeProduct = originalData as BarcodeLookupProduct
        setFormData({
          name: barcodeProduct.title || "",
          detailedName: barcodeProduct.title || "",
          aboutProduct: barcodeProduct.features?.join(". ") || "",
          subCategoriesId: barcodeProduct.category || "",
          customerReviews: "",
          barcode: barcodeProduct.barcode_number,
          barcodeFormats: barcodeProduct.barcode_formats || "EAN_13",
          active: true,
          secureCode: "",
          description: barcodeProduct.features?.join(". ") || "",
          manufacturerCode: barcodeProduct.mpn || "",
          brand: barcodeProduct.brand || "",
          packaging: "",
          primaryMarket: barcodeProduct.category || "",
          scent: "",
          size: "",
          type: "",
          sds: "",
          price: "",
          discount: "",
          stock: "",
        })
      } else if ("barcodeNumber" in originalData) {
        const barcodeProduct = originalData as BarcodeProduct
        setFormData({
          name: barcodeProduct.title || "",
          detailedName: barcodeProduct.title || "",
          aboutProduct: "",
          subCategoriesId: barcodeProduct.category || "",
          customerReviews: "",
          barcode: barcodeProduct.barcodeNumber,
          barcodeFormats: barcodeProduct.barcodeFormats || "EAN_13",
          active: true,
          secureCode: "",
          description: "",
          manufacturerCode: barcodeProduct.mpn || "",
          brand: barcodeProduct.brand || "",
          packaging: "",
          primaryMarket: barcodeProduct.category || "",
          scent: "",
          size: "",
          type: "",
          sds: "",
          price: "",
          discount: "",
          stock: "",
        })
      }
    } else {
      // Handle local Product
      const localProduct = originalData as Product
      setFormData({
        name: localProduct.name || "",
        detailedName: localProduct.detailedName || "",
        aboutProduct: localProduct.aboutProduct || "",
        subCategoriesId: localProduct.subCategoriesId || "",
        customerReviews: localProduct.customerReviews || "",
        barcode: String(localProduct.barcode),
        barcodeFormats: localProduct.barcodeFormats || "EAN_13",
        active: localProduct.active,
        secureCode: "",
        description: localProduct.description || "",
        manufacturerCode: localProduct.manufacturerCode || "",
        brand: localProduct.brand || "",
        packaging: localProduct.packaging || "",
        primaryMarket: localProduct.primaryMarket || "",
        scent: localProduct.scent || "",
        size: localProduct.size || "",
        type: localProduct.type || "",
        sds: localProduct.sds || "",
        price: "",
        discount: "",
        stock: "",
      })
    }

    // Clear search
    setSearchQuery("")
    setShowDropdown(false)
    setSearchResults([])

    // Clear all errors since form is now filled with valid data
    setErrors({})
  }

  // Clear all form data and images
  const handleClearAll = () => {
    // Reset form data
    setFormData(initialFormData)

    // Clear file data and revoke URLs
    if (fileData.coverPhotoPreview) {
      URL.revokeObjectURL(fileData.coverPhotoPreview)
    }
    for (const preview of fileData.photosPreviews) {
      URL.revokeObjectURL(preview)
    }
    setFileData(initialFileData)

    // Clear existing images
    setExistingImages({ coverPhoto: null, photos: [] })

    // Reset product selected state
    setIsProductSelected(false)
    setSelectedProduct(null)

    // Clear errors
    setErrors({})

    // Clear search
    setSearchQuery("")
    setSearchResults([])
    setShowDropdown(false)

    // Reset file inputs
    if (coverPhotoInputRef.current) {
      coverPhotoInputRef.current.value = ""
    }
    if (photosInputRef.current) {
      photosInputRef.current.value = ""
    }
  }

  // Determine which tab contains the first error
  const getTabForField = (fieldName: string): "basic" | "details" | "media" => {
    const basicFields = [
      "name",
      "detailedName",
      "aboutProduct",
      "subCategoriesId",
      "customerReviews",
      "barcode",
      "barcodeFormats",
      "active",
      "price",
      "discount",
      "stock",
    ]
    const detailsFields = [
      "description",
      "manufacturerCode",
      "brand",
      "packaging",
      "primaryMarket",
      "scent",
      "size",
      "type",
      "sds",
    ]

    if (basicFields.includes(fieldName)) return "basic"
    if (detailsFields.includes(fieldName)) return "details"
    return "media"
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-light-mint-gray">
        <VendorHeader />
        <div className="flex flex-1">
          <VendorSidebar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-steel-blue mb-4">Authentication Required</h2>
              <p className="text-gray-600 mb-6">You need to be logged in to create a product.</p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
              >
                Go to Login
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle cover photo selection
  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Revoke old preview URL to prevent memory leak
      if (fileData.coverPhotoPreview) {
        URL.revokeObjectURL(fileData.coverPhotoPreview)
      }
      setFileData((prev) => ({
        ...prev,
        coverPhoto: file,
        coverPhotoPreview: URL.createObjectURL(file),
      }))
    }
  }

  // Remove cover photo
  const removeCoverPhoto = () => {
    if (fileData.coverPhotoPreview) {
      URL.revokeObjectURL(fileData.coverPhotoPreview)
    }
    setFileData((prev) => ({
      ...prev,
      coverPhoto: null,
      coverPhotoPreview: null,
    }))
    if (coverPhotoInputRef.current) {
      coverPhotoInputRef.current.value = ""
    }
  }

  // Handle additional photos selection
  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const newPreviews = files.map((file) => URL.createObjectURL(file))
      setFileData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...files],
        photosPreviews: [...prev.photosPreviews, ...newPreviews],
      }))
    }
  }

  // Remove a photo by index
  const removePhoto = (index: number) => {
    URL.revokeObjectURL(fileData.photosPreviews[index])
    setFileData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photosPreviews: prev.photosPreviews.filter((_, i) => i !== index),
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (!formData.detailedName.trim()) {
      newErrors.detailedName = "Detailed name is required"
    }

    if (!formData.barcode.trim()) {
      newErrors.barcode = "Barcode is required"
    } else if (Number.isNaN(Number(formData.barcode))) {
      newErrors.barcode = "Barcode must be a number"
    }

    if (!formData.subCategoriesId.trim()) {
      newErrors.subCategoriesId = "Category is required"
    }

    // Validate user product fields (only for create mode, not edit mode)
    if (!isEditMode) {
      if (!formData.price.trim()) {
        newErrors.price = "Price is required"
      } else if (Number.isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        newErrors.price = "Price must be a positive number"
      }

      // Discount is optional, but if provided, must be a valid non-negative number
      if (formData.discount.trim() && (Number.isNaN(Number(formData.discount)) || Number(formData.discount) < 0)) {
        newErrors.discount = "Discount must be a non-negative number"
      }

      if (!formData.stock.trim()) {
        newErrors.stock = "Stock is required"
      } else if (Number.isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
        newErrors.stock = "Stock must be a non-negative number"
      }
    }

    setErrors(newErrors)

    // If there are errors, show toast and switch to the tab with the first error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      const errorTab = getTabForField(firstErrorField)
      setActiveTab(errorTab)

      const errorCount = Object.keys(newErrors).length
      const errorMessage =
        errorCount === 1 ? `${newErrors[firstErrorField]}` : `Please fill in ${errorCount} required fields`

      showToast(errorMessage, "error")
    }
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      // Edit mode: Update user-product only
      if (isEditMode && userProductId) {
        await productsAPI.updateUserProduct(
          userProductId,
          {
            price: Number(formData.price),
            discount: formData.discount.trim() ? Number(formData.discount) : 0,
            stock: Number(formData.stock),
            active: formData.active,
          },
          accessToken || "",
        )

        showToast("Product updated successfully!", "success")

        // Redirect immediately
        router.push("/vendor-dashboard/products")
        return
      }

      // Create mode: Continue with existing logic
      let productId: string

      // Case 1: Local product selected - only create user-product
      if (selectedProduct && selectedProduct.source === "local") {
        const localProduct = selectedProduct.originalData as Product
        productId = localProduct.id

        // Create user product
        const userProductPayload: CreateUserProductPayload = {
          productId,
          price: Number(formData.price),
          discount: formData.discount.trim() ? Number(formData.discount) : 0,
          stock: Number(formData.stock),
          active: formData.active,
        }

        await productsAPI.createUserProduct(userProductPayload, accessToken || "")
      } else {
        // Case 2: Barcode product selected or manual creation - create product first, then user-product
        // Prepare the data payload (JSON) - active is not included in product data
        const productData: CreateProductData = {
          name: formData.name,
          detailedName: formData.detailedName,
          aboutProduct: formData.aboutProduct,
          subCategoriesId: formData.subCategoriesId,
          customerReviews: formData.customerReviews || undefined,
          barcode: Number(formData.barcode),
          barcodeFormats: formData.barcodeFormats,
          active: true, // Product is always active, user-product has its own active field
          secureCode: formData.secureCode || undefined,
          description: formData.description,
          manufacturerCode: formData.manufacturerCode,
          brand: formData.brand,
          packaging: formData.packaging,
          primaryMarket: formData.primaryMarket,
          scent: formData.scent,
          size: formData.size,
          type: formData.type,
          sds: formData.sds,
        }

        // Create the product with multipart/form-data
        const createdProduct = await productsAPI.createProduct(
          {
            data: productData,
            coverPhoto: fileData.coverPhoto || undefined,
            photos: fileData.photos.length > 0 ? fileData.photos : undefined,
          },
          accessToken || "",
        )

        productId = createdProduct.id

        // Create user product
        const userProductPayload: CreateUserProductPayload = {
          productId,
          price: Number(formData.price),
          discount: formData.discount.trim() ? Number(formData.discount) : 0,
          stock: Number(formData.stock),
          active: formData.active,
        }

        await productsAPI.createUserProduct(userProductPayload, accessToken || "")
      }

      showToast("Product created successfully!", "success")

      // Redirect immediately
      router.push("/vendor-dashboard/products")
    } catch (error: unknown) {
      const err = error as { message?: string }
      const errorMessage = err.message || `Failed to ${isEditMode ? "update" : "create"} product. Please try again.`
      setErrors({ submit: errorMessage })
      showToast(errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-light-mint-gray">
      <VendorHeader />
      <div className="flex flex-1">
        <VendorSidebar />
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link
                href="/vendor-dashboard/products"
                className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-steel-blue">
                  {isEditMode ? "Edit Product" : "Create New Product"}
                </h1>
                <p className="text-gray-600">
                  {isEditMode ? "Update product information" : "Add a new product to your catalog"}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push("/vendor-dashboard/products")}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-product-form"
                disabled={isLoading}
                className="px-6 py-2 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Product"
                    : "Create Product"}
              </button>
            </div>
          </div>

          {/* Product Search Autocomplete */}
          {!isEditMode && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-pale-lime rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-steel-blue" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-steel-blue">Search Product</h2>
                  <p className="text-sm text-gray-500">Search existing products by barcode or product name</p>
                </div>
              </div>

              <div className="relative">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="Enter barcode number or product name..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("")
                        setSearchResults([])
                        setShowDropdown(false)
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto"
                  >
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {searchResults.length} results found
                      </p>
                      {searchResults.map((product) => (
                        <button
                          key={`${product.source}-${product.id}`}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className="w-full flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          {/* Product Image */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                            {product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E"
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.title || "Unnamed Product"}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-mono">
                                <Barcode className="w-3 h-3 mr-1" />
                                {product.barcode}
                              </span>
                              {product.brand && <span className="text-xs text-gray-500 truncate">{product.brand}</span>}
                            </div>
                            {product.category && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{product.category}</p>
                            )}
                          </div>

                          {/* Source Badge */}
                          <div className="shrink-0">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                product.source === "local" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {product.source === "local" ? "Local" : "Barcode DB"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {showDropdown && searchResults.length === 0 && !isSearching && debouncedSearchQuery.trim() && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-6 text-center"
                  >
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No results found</p>
                    <p className="text-gray-400 text-sm mt-1">No matching products for "{debouncedSearchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "basic"
                    ? "text-steel-blue border-steel-blue"
                    : "text-gray-600 border-transparent hover:text-steel-blue"
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Basic Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "text-steel-blue border-steel-blue"
                    : "text-gray-600 border-transparent hover:text-steel-blue"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Product Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "media"
                    ? "text-steel-blue border-steel-blue"
                    : "text-gray-600 border-transparent hover:text-steel-blue"
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Media
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="create-product-form" onSubmit={handleSubmit}>
            <div className="bg-white rounded-b-2xl shadow-lg p-8">
              {errors.submit && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Basic Information Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className={`w-full px-4 py-3 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., Premium Dental Composite Kit"
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="detailedName" className="block text-sm font-medium text-gray-700 mb-2">
                        Detailed Name *
                      </label>
                      <input
                        id="detailedName"
                        type="text"
                        name="detailedName"
                        value={formData.detailedName}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className={`w-full px-4 py-3 border ${errors.detailedName ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., Premium Dental Composite Kit - 20 Shades with Applicators"
                      />
                      {errors.detailedName && <p className="text-red-500 text-sm mt-1">{errors.detailedName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="aboutProduct" className="block text-sm font-medium text-gray-700 mb-2">
                      About Product
                    </label>
                    <textarea
                      id="aboutProduct"
                      name="aboutProduct"
                      value={formData.aboutProduct}
                      onChange={handleInputChange}
                      disabled={isProductSelected}
                      rows={4}
                      className={`w-full px-4 py-3 border ${errors.aboutProduct ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                      placeholder="Describe your product in detail..."
                    />
                    {errors.aboutProduct && <p className="text-red-500 text-sm mt-1">{errors.aboutProduct}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="subCategoriesId" className="block text-sm font-medium text-gray-700 mb-2">
                        Category ID *
                      </label>
                      <input
                        id="subCategoriesId"
                        type="text"
                        name="subCategoriesId"
                        value={formData.subCategoriesId}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className={`w-full px-4 py-3 border ${errors.subCategoriesId ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="Enter category ID"
                      />
                      {errors.subCategoriesId && <p className="text-red-500 text-sm mt-1">{errors.subCategoriesId}</p>}
                    </div>

                    <div>
                      <label htmlFor="customerReviews" className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Reviews (Optional)
                      </label>
                      <input
                        id="customerReviews"
                        type="text"
                        name="customerReviews"
                        value={formData.customerReviews}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Initial customer reviews"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                        <Barcode className="w-4 h-4 inline mr-1" />
                        Barcode *
                      </label>
                      <input
                        id="barcode"
                        type="text"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className={`w-full px-4 py-3 border ${errors.barcode ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., 8901234567890"
                      />
                      {errors.barcode && <p className="text-red-500 text-sm mt-1">{errors.barcode}</p>}
                    </div>

                    <div>
                      <label htmlFor="barcodeFormats" className="block text-sm font-medium text-gray-700 mb-2">
                        Barcode Format
                      </label>
                      <select
                        id="barcodeFormats"
                        name="barcodeFormats"
                        value={formData.barcodeFormats}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {barcodeFormatOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer mt-6">
                        <input
                          type="checkbox"
                          name="active"
                          checked={formData.active}
                          onChange={handleInputChange}
                          disabled={isProductSelected && !isEditMode}
                          className="w-5 h-5 text-steel-blue border-gray-300 rounded focus:ring-steel-blue disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">Product is Active</span>
                      </label>
                    </div>
                  </div>

                  {/* User Product Fields */}
                  {!isEditMode && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-steel-blue mb-4">Pricing & Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                            Price *
                          </label>
                          <input
                            id="price"
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border ${errors.price ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                        </div>

                        <div>
                          <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                            Discount <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            id="discount"
                            type="number"
                            name="discount"
                            value={formData.discount}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border ${errors.discount ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.discount && <p className="text-red-500 text-sm mt-1">{errors.discount}</p>}
                        </div>

                        <div>
                          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                            Stock *
                          </label>
                          <input
                            id="stock"
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            min="0"
                            step="1"
                            className={`w-full px-4 py-3 border ${errors.stock ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                            placeholder="0"
                          />
                          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Mode: Show Pricing & Inventory */}
                  {isEditMode && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-steel-blue mb-4">Pricing & Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                            Price *
                          </label>
                          <input
                            id="price"
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border ${errors.price ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                        </div>

                        <div>
                          <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                            Discount <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            id="discount"
                            type="number"
                            name="discount"
                            value={formData.discount}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border ${errors.discount ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.discount && <p className="text-red-500 text-sm mt-1">{errors.discount}</p>}
                        </div>

                        <div>
                          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                            Stock *
                          </label>
                          <input
                            id="stock"
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            min="0"
                            step="1"
                            className={`w-full px-4 py-3 border ${errors.stock ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                            placeholder="0"
                          />
                          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Product Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-blue-700 text-sm">
                      These details provide additional information about your product and help buyers make informed
                      decisions.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={isProductSelected}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Detailed product description..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="manufacturerCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturer Code
                      </label>
                      <input
                        id="manufacturerCode"
                        type="text"
                        name="manufacturerCode"
                        value={formData.manufacturerCode}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., MNF-4452"
                      />
                    </div>

                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                      </label>
                      <input
                        id="brand"
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., DentPro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="packaging" className="block text-sm font-medium text-gray-700 mb-2">
                        Packaging
                      </label>
                      <input
                        id="packaging"
                        type="text"
                        name="packaging"
                        value={formData.packaging}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., Box of 100"
                      />
                    </div>

                    <div>
                      <label htmlFor="primaryMarket" className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Market
                      </label>
                      <input
                        id="primaryMarket"
                        type="text"
                        name="primaryMarket"
                        value={formData.primaryMarket}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., Dental"
                      />
                    </div>

                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <input
                        id="type"
                        type="text"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., Disposable"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <input
                        id="size"
                        type="text"
                        name="size"
                        value={formData.size}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., Large"
                      />
                    </div>

                    <div>
                      <label htmlFor="scent" className="block text-sm font-medium text-gray-700 mb-2">
                        Scent
                      </label>
                      <input
                        id="scent"
                        type="text"
                        name="scent"
                        value={formData.scent}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., Neutral"
                      />
                    </div>

                    <div>
                      <label htmlFor="sds" className="block text-sm font-medium text-gray-700 mb-2">
                        SDS Document URL
                      </label>
                      <input
                        id="sds"
                        type="url"
                        name="sds"
                        value={formData.sds}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="https://example.com/sds/product.pdf"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="space-y-8">
                  {/* Cover Photo Section */}
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Photo
                      <span className="text-gray-400 font-normal ml-2">(Main product image)</span>
                    </legend>
                    <p className="text-gray-500 text-sm mb-4">
                      Upload a high-quality cover image for your product. This will be the main image displayed.
                    </p>

                    <input
                      ref={coverPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverPhotoChange}
                      disabled={isProductSelected}
                      className="hidden"
                      id="coverPhotoInput"
                    />

                    {fileData.coverPhotoPreview || existingImages.coverPhoto ? (
                      <div className="relative inline-block">
                        <div className="w-48 h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-steel-blue">
                          <Image
                            src={fileData.coverPhotoPreview || existingImages.coverPhoto || ""}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                            width={192}
                            height={192}
                          />
                        </div>
                        <span className="absolute top-2 left-2 bg-steel-blue text-white text-xs px-2 py-1 rounded">
                          {fileData.coverPhotoPreview ? "New Cover" : "Existing"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (fileData.coverPhotoPreview) {
                              removeCoverPhoto()
                            } else {
                              setExistingImages((prev) => ({ ...prev, coverPhoto: null }))
                            }
                          }}
                          disabled={isProductSelected}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => coverPhotoInputRef.current?.click()}
                          className="absolute bottom-2 right-2 px-3 py-1 bg-white text-gray-700 text-xs rounded shadow hover:bg-gray-50 transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => coverPhotoInputRef.current?.click()}
                        disabled={isProductSelected}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-steel-blue hover:bg-gray-50 transition-colors cursor-pointer w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Click to upload cover photo</p>
                        <p className="text-gray-400 text-sm mt-1">PNG, JPG, GIF up to 10MB</p>
                      </button>
                    )}
                  </fieldset>

                  {/* Additional Photos Section */}
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Photos
                      <span className="text-gray-400 font-normal ml-2">(Optional)</span>
                    </legend>
                    <p className="text-gray-500 text-sm mb-4">
                      Upload additional product images to show different angles or details.
                    </p>

                    <input
                      ref={photosInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotosChange}
                      disabled={isProductSelected}
                      className="hidden"
                      id="photosInput"
                    />

                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => photosInputRef.current?.click()}
                        disabled={isProductSelected}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Photos
                      </button>

                      {fileData.photosPreviews.length > 0 || existingImages.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {/* Existing photos from selected product */}
                          {existingImages.photos.map((photo, index) => (
                            <div key={`existing-${photo}`} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <Image
                                  src={photo}
                                  alt={`Existing ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  width={192}
                                  height={192}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setExistingImages((prev) => ({
                                    ...prev,
                                    photos: prev.photos.filter((_, i) => i !== index),
                                  }))
                                }}
                                disabled={isProductSelected}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-0 disabled:cursor-not-allowed"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <span className="absolute bottom-2 left-2 bg-blue-500/80 text-white text-xs px-2 py-0.5 rounded">
                                Existing
                              </span>
                            </div>
                          ))}
                          {/* Newly uploaded photos */}
                          {fileData.photosPreviews.map((preview, index) => (
                            <div key={preview} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-400">
                                <Image
                                  src={preview}
                                  alt={`New ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  width={192}
                                  height={192}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                disabled={isProductSelected}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-0 disabled:cursor-not-allowed"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <span className="absolute bottom-2 left-2 bg-green-500/80 text-white text-xs px-2 py-0.5 rounded">
                                New
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-400">No additional photos added</p>
                          <p className="text-gray-300 text-sm mt-1">Click "Add Photos" to upload more images</p>
                        </div>
                      )}
                    </div>
                  </fieldset>

                  {/* Upload Summary */}
                  {(fileData.coverPhoto ||
                    fileData.photos.length > 0 ||
                    existingImages.coverPhoto ||
                    existingImages.photos.length > 0) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Images Summary</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {existingImages.coverPhoto && !fileData.coverPhoto && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                            Cover photo: Existing image
                          </li>
                        )}
                        {fileData.coverPhoto && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            Cover photo: {fileData.coverPhoto.name} (new)
                          </li>
                        )}
                        {existingImages.photos.length > 0 && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                            Existing photos: {existingImages.photos.length} image(s)
                          </li>
                        )}
                        {fileData.photos.length > 0 && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            New photos: {fileData.photos.length} file(s)
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "details") setActiveTab("basic")
                    else if (activeTab === "media") setActiveTab("details")
                  }}
                  className={`px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium ${
                    activeTab === "basic" ? "invisible" : ""
                  }`}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "basic") setActiveTab("details")
                    else if (activeTab === "details") setActiveTab("media")
                  }}
                  className={`px-6 py-2 bg-pale-lime text-steel-blue rounded-lg hover:bg-opacity-90 transition-colors font-medium ${
                    activeTab === "media" ? "invisible" : ""
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
