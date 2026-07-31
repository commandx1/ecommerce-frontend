"use client"

import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import BrandFilterDropdown from "@/app/vendor-dashboard/products/create/components/BrandFilterDropdown"
import ProductDetailsModal from "@/app/vendor-dashboard/products/create/components/ProductDetailsModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/components/ui/Toast"
import { useDebounce } from "@/lib/hooks/useDebounce"
import {
  type CreateUserProductPayload,
  getFullImageUrl,
  type NormalizedSearchProduct,
  type Product,
  type ProductAttribute,
  type ProductVendorRequestData,
  productsAPI,
} from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"

const SEARCH_PAGE_SIZE = 10
const SEARCH_SCROLL_THRESHOLD_PX = 48

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

interface FormData {
  // Product fields
  name: string
  detailedName: string
  barcode: string
  barcodeFormats: string
  active: boolean
  // Product Details fields
  description: string
  manufacturerCode: string
  manufacturer: string
  brand: string
  exampleVariationsProductId: string
  categoryLevel1: string
  categoryLevel2: string
  categoryLevel3: string
  categoryLevel4: string
  categoryLevel5: string
  manufacturerSiteProductPage: string
  dentalLicenseRequired: string
  reorderId: string
  referanceNumber: string
  height: string
  length: string
  width: string
  weight: string
  // User Product fields
  skuCode: string
  price: string
  stock: string
  shipmentFee: string
  heavyShippingSurcharge: string
  exportPackaging: boolean
  fulfillmentPolicy: string
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
  barcode: "",
  barcodeFormats: "EAN_13",
  active: true,
  description: "",
  manufacturerCode: "",
  manufacturer: "",
  brand: "",
  exampleVariationsProductId: "",
  categoryLevel1: "",
  categoryLevel2: "",
  categoryLevel3: "",
  categoryLevel4: "",
  categoryLevel5: "",
  manufacturerSiteProductPage: "",
  dentalLicenseRequired: "",
  reorderId: "",
  referanceNumber: "",
  height: "",
  length: "",
  width: "",
  weight: "",
  skuCode: "",
  price: "",
  stock: "",
  shipmentFee: "",
  heavyShippingSurcharge: "",
  exportPackaging: false,
  fulfillmentPolicy: "",
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

// For manually entered image links (URLs, not files)
interface LinkedImages {
  coverPhoto: string | null
  photos: string[]
}

const initialLinkedImages: LinkedImages = {
  coverPhoto: null,
  photos: [],
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

function CreateProductPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, isAuthenticated, user } = useAuthStore()

  const editUserProductId = searchParams.get("edit")
  const [isEditMode] = useState(!!editUserProductId)
  const [userProductId] = useState<string | null>(editUserProductId)

  // Edit a rejected product and resubmit it for review (distinct from isEditMode, which only
  // updates price/stock on an already-approved UserProduct)
  const reviewEditProductId = searchParams.get("reviewEditId")
  const reviewEditUserProductId = searchParams.get("reviewUserProductId")
  const [isReviewEditMode] = useState(!!reviewEditProductId)
  const [reviewProductId] = useState<string | null>(reviewEditProductId)
  const [reviewUserProductId] = useState<string | null>(reviewEditUserProductId)

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  // Discount is only used by the edit flow (updateUserProduct); it is not part of the review DTO
  const [editDiscount, setEditDiscount] = useState("")
  const [fileData, setFileData] = useState<FileData>(initialFileData)
  const [existingImages, setExistingImages] = useState<ExistingImages>({ coverPhoto: null, photos: [] })
  const [linkedImages, setLinkedImages] = useState<LinkedImages>(initialLinkedImages)
  const [coverPhotoMode, setCoverPhotoMode] = useState<"upload" | "link">("upload")
  const [photosMode, setPhotosMode] = useState<"upload" | "link">("upload")
  const [coverPhotoUrlInput, setCoverPhotoUrlInput] = useState("")
  const [photoUrlInput, setPhotoUrlInput] = useState("")
  const [coverPhotoUrlError, setCoverPhotoUrlError] = useState("")
  const [photoUrlError, setPhotoUrlError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "media">("basic")
  const [isProductSelected, setIsProductSelected] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<NormalizedSearchProduct | null>(null)

  // Search-first UX: start on the search view unless we're editing/resubmitting an existing product
  const [view, setView] = useState<"search" | "form">(editUserProductId || reviewEditProductId ? "form" : "search")
  const [modalProduct, setModalProduct] = useState<NormalizedSearchProduct | null>(null)

  // File input refs
  const coverPhotoInputRef = useRef<HTMLInputElement>(null)
  const photosInputRef = useRef<HTMLInputElement>(null)

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<NormalizedSearchProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMoreResults, setIsLoadingMoreResults] = useState(false)
  const [searchResultsPage, setSearchResultsPage] = useState(0)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(new Set())
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchResultsListRef = useRef<HTMLDivElement>(null)
  const searchAbortControllerRef = useRef<AbortController | null>(null)

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

  // Search function (GET /api/products/active?search=...&brand=...&page=...&size=...)
  const performSearch = useCallback(
    async (query: string, brand: string | null, page: number, options: { append?: boolean } = {}) => {
      if (!query.trim() || !accessToken) {
        searchAbortControllerRef.current?.abort()
        setSearchResults([])
        setShowDropdown(false)
        setHasMoreResults(false)
        return
      }

      searchAbortControllerRef.current?.abort()
      const controller = new AbortController()
      searchAbortControllerRef.current = controller

      if (options.append) {
        setIsLoadingMoreResults(true)
      } else {
        setIsSearching(true)
      }

      try {
        const response = await productsAPI.searchActiveProducts(
          { search: query.trim(), brand, page, size: SEARCH_PAGE_SIZE },
          accessToken,
          controller.signal,
        )
        const normalized = response.content.map((item) => productsAPI.normalizeActiveProductSearchItem(item))

        setSearchResults((prev) => (options.append ? [...prev, ...normalized] : normalized))
        setSearchResultsPage(response.number)
        setHasMoreResults(!response.last)
        setShowDropdown(true)
      } catch (error) {
        if (controller.signal.aborted) return

        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? (error.message as string)
            : error instanceof Error
              ? error.message
              : "An error occurred during search"
        showToast.error(`Search error: ${errorMessage}`)
        if (!options.append) setSearchResults([])
        setHasMoreResults(false)
      } finally {
        if (controller.signal.aborted) return
        if (options.append) setIsLoadingMoreResults(false)
        else setIsSearching(false)
      }
    },
    [accessToken],
  )

  // Trigger a fresh (page 0) search whenever the debounced query or the brand filter changes
  useEffect(() => {
    performSearch(debouncedSearchQuery, selectedBrand, 0)
  }, [debouncedSearchQuery, selectedBrand, performSearch])

  // Abort any in-flight search on unmount
  useEffect(() => {
    return () => {
      searchAbortControllerRef.current?.abort()
    }
  }, [])

  const handleSearchResultsScroll = () => {
    const el = searchResultsListRef.current
    if (!el || isSearching || isLoadingMoreResults || !hasMoreResults) return

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom <= SEARCH_SCROLL_THRESHOLD_PX) {
      performSearch(debouncedSearchQuery, selectedBrand, searchResultsPage + 1, { append: true })
    }
  }

  // A search result row was clicked: fetch full product details before opening the modal,
  // since /api/products/active only returns a partial projection (id, name, brand, ...)
  const handleSelectSearchResult = async (item: NormalizedSearchProduct) => {
    if (!accessToken || loadingDetailId) return

    setLoadingDetailId(item.id)
    try {
      const fullProduct = await productsAPI.getProductById(item.id, accessToken)
      setModalProduct(productsAPI.normalizeBarcodeResult(fullProduct))
    } catch (error) {
      const errorMessage = (error as { message?: string })?.message || "Failed to load product details"
      showToast.error(errorMessage)
    } finally {
      setLoadingDetailId(null)
    }
  }

  // Load product data in edit mode
  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to re-run this effect>
  useEffect(() => {
    if (isEditMode && userProductId && accessToken) {
      loadProductForEdit()
    }
  }, [isEditMode, userProductId, accessToken])

  // Load full product data for a rejected product that's being edited and resubmitted for review
  // biome-ignore lint/correctness/useExhaustiveDependencies: <no need to re-run this effect>
  useEffect(() => {
    if (isReviewEditMode && reviewProductId && reviewUserProductId && accessToken) {
      loadProductForReviewEdit()
    }
  }, [isReviewEditMode, reviewProductId, reviewUserProductId, accessToken])

  const loadProductForReviewEdit = async () => {
    if (!reviewProductId || !reviewUserProductId || !accessToken) return

    try {
      setIsLoading(true)

      const [product, userProduct] = await Promise.all([
        productsAPI.getProductByIdForAdmin(reviewProductId, accessToken),
        productsAPI.getUserProductById(reviewUserProductId, accessToken),
      ])

      setFormData({
        ...initialFormData,
        name: product.name || "",
        detailedName: product.detailedName || "",
        barcode: product.barcode ? String(product.barcode) : "",
        barcodeFormats: product.barcodeFormats || "EAN_13",
        active: userProduct.active,
        description: product.description || "",
        manufacturerCode: product.manufacturerCode || "",
        manufacturer: product.manufacturer || "",
        brand: product.brand || "",
        exampleVariationsProductId: product.exampleVariationsProductId || "",
        categoryLevel1: product.categoryLevel1 || "",
        categoryLevel2: product.categoryLevel2 || "",
        categoryLevel3: product.categoryLevel3 || "",
        categoryLevel4: product.categoryLevel4 || "",
        categoryLevel5: product.categoryLevel5 || "",
        manufacturerSiteProductPage: product.manufacturerSiteProductPage || "",
        dentalLicenseRequired: product.dentalLicenseRequired || "",
        reorderId: product.reorderId || "",
        referanceNumber: product.referanceNumber || "",
        height: product.height != null ? String(product.height) : "",
        length: product.length != null ? String(product.length) : "",
        width: product.width != null ? String(product.width) : "",
        weight: product.weight != null ? String(product.weight) : "",
        skuCode: userProduct.skuCode || "",
        price: String(userProduct.price),
        stock: String(userProduct.stock),
        shipmentFee: userProduct.shipmentFee != null ? String(userProduct.shipmentFee) : "",
        heavyShippingSurcharge: userProduct.heavyShippingSurcharge != null ? String(userProduct.heavyShippingSurcharge) : "",
      })

      const coverPhoto = product.coverPhotoPath ? getFullImageUrl(product.coverPhotoPath) : null
      const photos = product.photoPhats ? product.photoPhats.map(getFullImageUrl) : []
      setExistingImages({ coverPhoto, photos })
    } catch (error) {
      showToast.error((error as { message?: string })?.message || "Failed to load product data")
      router.push("/vendor-dashboard/products")
    } finally {
      setIsLoading(false)
    }
  }

  const loadProductForEdit = async () => {
    if (!userProductId || !accessToken) return

    try {
      setIsLoading(true)
      // First, get user-product to get productId and user-product fields
      const userProducts = await productsAPI.getUserProducts(accessToken)
      const userProduct = userProducts.find((up) => up.id === userProductId)

      if (!userProduct) {
        showToast.error("Product not found")
        router.push("/vendor-dashboard/products")
        return
      }

      // Get product details
      const product = await productsAPI.getProductById(userProduct.productId, accessToken)

      // Populate form data
      setFormData({
        ...initialFormData,
        name: product.name || "",
        detailedName: product.detailedName || "",
        barcode: String(product.barcode),
        barcodeFormats: product.barcodeFormats || "EAN_13",
        active: userProduct.active,
        description: product.description || "",
        manufacturerCode: product.manufacturerCode || "",
        brand: product.brand || "",
        price: String(userProduct.price),
        stock: String(userProduct.stock),
      })
      setEditDiscount(String(userProduct.discount))

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
      showToast.error((error as { message?: string })?.message || "Failed to load product data")
      router.push("/vendor-dashboard/products")
    } finally {
      setIsLoading(false)
    }
  }

  // Clear all form data and images
  const handleClearAll = () => {
    // Reset form data
    setFormData(initialFormData)
    setAttributes([])
    setEditDiscount("")

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

    // Clear linked images
    setLinkedImages(initialLinkedImages)
    setCoverPhotoMode("upload")
    setPhotosMode("upload")
    setCoverPhotoUrlInput("")
    setPhotoUrlInput("")
    setCoverPhotoUrlError("")
    setPhotoUrlError("")

    // Reset product selected state
    setIsProductSelected(false)
    setSelectedProduct(null)

    // Clear errors
    setErrors({})

    // Clear search
    searchAbortControllerRef.current?.abort()
    setSearchQuery("")
    setSelectedBrand(null)
    setSearchResults([])
    setSearchResultsPage(0)
    setHasMoreResults(false)
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
      "barcode",
      "barcodeFormats",
      "active",
      "skuCode",
      "price",
      "discount",
      "stock",
      "shipmentFee",
      "heavyShippingSurcharge",
      "exportPackaging",
      "fulfillmentPolicy",
    ]
    const detailsFields = [
      "description",
      "manufacturerCode",
      "manufacturer",
      "brand",
      "exampleVariationsProductId",
      "categoryLevel1",
      "categoryLevel2",
      "categoryLevel3",
      "categoryLevel4",
      "categoryLevel5",
      "manufacturerSiteProductPage",
      "dentalLicenseRequired",
      "reorderId",
      "referanceNumber",
      "height",
      "length",
      "width",
      "weight",
    ]

    if (basicFields.includes(fieldName)) return "basic"
    if (detailsFields.includes(fieldName)) return "details"
    return "media"
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="bg-surface-elevated rounded-2xl shadow-lg p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-warning" />
          </div>
          <h2 className="text-2xl font-bold text-brand mb-4">Authentication Required</h2>
          <p className="text-text-secondary mb-6">You need to be logged in to create a product.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full bg-brand text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
          >
            Go to Login
          </button>
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

  // Add cover photo by URL
  const handleAddCoverPhotoLink = () => {
    if (!isValidImageUrl(coverPhotoUrlInput)) {
      setCoverPhotoUrlError("Please enter a valid image URL (starting with http:// or https://)")
      return
    }
    setLinkedImages((prev) => ({ ...prev, coverPhoto: coverPhotoUrlInput.trim() }))
    setCoverPhotoUrlInput("")
    setCoverPhotoUrlError("")
  }

  // Remove linked cover photo
  const removeLinkedCoverPhoto = () => {
    setLinkedImages((prev) => ({ ...prev, coverPhoto: null }))
  }

  // Add an additional photo by URL
  const handleAddPhotoLink = () => {
    if (!isValidImageUrl(photoUrlInput)) {
      setPhotoUrlError("Please enter a valid image URL (starting with http:// or https://)")
      return
    }
    const url = photoUrlInput.trim()
    setLinkedImages((prev) => (prev.photos.includes(url) ? prev : { ...prev, photos: [...prev.photos, url] }))
    setPhotoUrlInput("")
    setPhotoUrlError("")
  }

  // Remove a linked photo by index
  const removeLinkedPhoto = (index: number) => {
    setLinkedImages((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required"
    }

    if (formData.barcode && Number.isNaN(Number(formData.barcode))) {
      newErrors.barcode = "Barcode must be a number"
    }

    // Validate user product fields
    if (!formData.price.trim()) {
      newErrors.price = "Price is required"
    } else if (Number.isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number"
    }

    if (!formData.stock.trim()) {
      newErrors.stock = "Stock is required"
    } else if (Number.isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = "Stock must be a non-negative number"
    }

    if (isEditMode && !isReviewEditMode) {
      // Discount is optional, but if provided, must be a valid non-negative number
      if (editDiscount.trim() && (Number.isNaN(Number(editDiscount)) || Number(editDiscount) < 0)) {
        newErrors.discount = "Discount must be a non-negative number"
      }
    } else {
      // Optional numeric fields must be valid numbers when provided
      const optionalNumericFields: Array<[keyof FormData, string]> = [
        ["height", "Height"],
        ["length", "Length"],
        ["width", "Width"],
        ["weight", "Weight"],
        ["shipmentFee", "Shipment fee"],
        ["heavyShippingSurcharge", "Heavy shipping fee"]
      ]
      for (const [field, label] of optionalNumericFields) {
        const value = formData[field] as string
        if (value.trim() && (Number.isNaN(Number(value)) || Number(value) < 0)) {
          newErrors[field] = `${label} must be a non-negative number`
        }
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

      showToast.error(errorMessage)
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
            discount: editDiscount.trim() ? Number(editDiscount) : 0,
            stock: Number(formData.stock),
            active: formData.active,
          },
          accessToken || "",
        )

        showToast.success("Product updated successfully!")

        // Redirect immediately
        router.push("/vendor-dashboard/products")
        return
      }

      // Create mode: Continue with existing logic

      // Case 1: Local product selected - only create user-product
      if (!isReviewEditMode && selectedProduct && selectedProduct.source === "local") {
        const localProduct = selectedProduct.originalData as Product

        // Create user product
        const userProductPayload: CreateUserProductPayload = {
          productId: localProduct.id,
          price: Number(formData.price),
          discount: 0,
          stock: Number(formData.stock),
          active: formData.active,
        }

        await productsAPI.createUserProduct(userProductPayload, accessToken || "")

        showToast.success("Product created successfully!")
        router.push("/vendor-dashboard/products")
        return
      }

      // Case 2: Barcode product selected, manual creation, or resubmitting a rejected product -
      // Product + UserProduct info goes in a single ProductVendorRequestDto payload
      const toOptionalNumber = (value: string): number | undefined => (value.trim() ? Number(value) : undefined)
      const toOptionalString = (value: string): string | undefined => value.trim() || undefined

      const filledAttributes = attributes.filter((attr) => attr.attributeName.trim() && attr.attributeValue.trim())

      const productData: ProductVendorRequestData = {
        name: formData.name,
        detailedName: toOptionalString(formData.detailedName),
        // Fallback image paths (used by backend when no files are uploaded)
        coverPhotoPath: existingImages.coverPhoto || linkedImages.coverPhoto || undefined,
        photoPhats:
          [...existingImages.photos, ...linkedImages.photos].length > 0
            ? [...existingImages.photos, ...linkedImages.photos]
            : undefined,
        barcode: toOptionalNumber(formData.barcode),
        barcodeFormats: formData.barcodeFormats,
        description: toOptionalString(formData.description),
        manufacturerCode: toOptionalString(formData.manufacturerCode),
        manufacturer: toOptionalString(formData.manufacturer),
        brand: toOptionalString(formData.brand),
        exampleVariationsProductId: toOptionalString(formData.exampleVariationsProductId),
        categoryLevel1: toOptionalString(formData.categoryLevel1),
        categoryLevel2: toOptionalString(formData.categoryLevel2),
        categoryLevel3: toOptionalString(formData.categoryLevel3),
        categoryLevel4: toOptionalString(formData.categoryLevel4),
        categoryLevel5: toOptionalString(formData.categoryLevel5),
        manufacturerSiteProductPage: toOptionalString(formData.manufacturerSiteProductPage),
        dentalLicenseRequired: toOptionalString(formData.dentalLicenseRequired),
        reorderId: toOptionalString(formData.reorderId),
        referanceNumber: toOptionalString(formData.referanceNumber),
        height: toOptionalNumber(formData.height),
        length: toOptionalNumber(formData.length),
        width: toOptionalNumber(formData.width),
        weight: toOptionalNumber(formData.weight),
        attributes: filledAttributes.length > 0 ? filledAttributes : undefined,
        // UserProduct (vendor listing) fields
        skuCode: toOptionalString(formData.skuCode),
        price: Number(formData.price),
        stock: Number(formData.stock),
        active: formData.active,
        shipmentFee: toOptionalNumber(formData.shipmentFee),
        heavyShippingSurcharge: toOptionalNumber(formData.heavyShippingSurcharge),
        exportPackaging: formData.exportPackaging,
        fulfillmentPolicy: toOptionalString(formData.fulfillmentPolicy),
      }

      const reviewPayload = {
        data: productData,
        coverPhoto: fileData.coverPhoto || undefined,
        photos: fileData.photos.length > 0 ? fileData.photos : undefined,
      }

      if (isReviewEditMode && reviewProductId) {
        await productsAPI.updateProductForReview(reviewProductId, reviewPayload, accessToken || "")
        showToast.success("Product updated and resubmitted for review!")
      } else {
        await productsAPI.createProductForReview(reviewPayload, accessToken || "")
        showToast.success("Product submitted for review!")
      }

      // Redirect immediately
      router.push("/vendor-dashboard/products")
    } catch (error: unknown) {
      const err = error as { message?: string }
      const errorMessage =
        err.message || `Failed to ${isEditMode || isReviewEditMode ? "update" : "create"} product. Please try again.`
      setErrors({ submit: errorMessage })
      showToast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/vendor-dashboard/products"
            className="w-10 h-10 bg-surface-elevated rounded-lg shadow flex items-center justify-center hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-brand">
              {isReviewEditMode ? "Edit Rejected Product" : isEditMode ? "Edit Product" : "Create New Product"}
            </h1>
            <p className="text-text-secondary">
              {isReviewEditMode
                ? "Update your product and resubmit it for review"
                : isEditMode
                  ? "Update product information"
                  : "Add a new product to your catalog"}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          {view === "form" && !isEditMode && !isReviewEditMode && (
            <button
              type="button"
              onClick={() => {
                handleClearAll()
                setView("search")
              }}
              className="px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/vendor-dashboard/products")}
            className="px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium"
          >
            Cancel
          </button>
          {view === "form" && (
            <button
              type="submit"
              form="create-product-form"
              disabled={isLoading}
              className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading
                ? isReviewEditMode
                  ? "Resubmitting..."
                  : isEditMode
                    ? "Updating..."
                    : "Creating..."
                : isReviewEditMode
                  ? "Resubmit for Review"
                  : isEditMode
                    ? "Update Product"
                    : "Create Product"}
            </button>
          )}
        </div>
      </div>

      {/* Product Search Autocomplete */}
      {view === "search" && (
        <>
          <div className="w-full max-w-4xl bg-surface-elevated rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-accent-strong rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-muted" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand">Search Product</h2>
                <p className="text-sm text-text-muted">Search existing products by barcode or product name</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-stretch gap-2">
                <BrandFilterDropdown value={selectedBrand} onChange={setSelectedBrand} accessToken={accessToken} />

                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="Search by barcode, name, detailed name, or manufacturer code..."
                    className="w-full px-4 py-3 pl-12 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("")
                        setSearchResults([])
                        setShowDropdown(false)
                        setHasMoreResults(false)
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results Panel */}
              {showDropdown && searchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="relative z-10 w-full mt-2 bg-surface-elevated border border-border-soft rounded-xl shadow-xl"
                >
                  <div
                    ref={searchResultsListRef}
                    onScroll={handleSearchResultsScroll}
                    className="p-2 max-h-96 overflow-y-auto"
                  >
                    <p className="px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                      {searchResults.length} results found
                    </p>
                    {searchResults.map((product) => (
                      <button
                        key={`${product.source}-${product.id}`}
                        type="button"
                        disabled={loadingDetailId === product.id}
                        onClick={() => handleSelectSearchResult(product)}
                        className="w-full flex items-center space-x-4 p-3 hover:bg-surface-muted rounded-lg transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden shrink-0">
                          {product.images.length > 0 && !brokenImageIds.has(`${product.source}-${product.id}`) ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setBrokenImageIds((prev) => new Set(prev).add(`${product.source}-${product.id}`))
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-text-muted/70" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">{product.title || "Unnamed Product"}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {product.barcode && (
                              <span className="inline-flex items-center px-2 py-0.5 bg-surface text-text-primary text-xs rounded font-mono">
                                <Barcode className="w-3 h-3 mr-1" />
                                {product.barcode}
                              </span>
                            )}
                            {product.brand && <span className="text-xs text-text-muted truncate">{product.brand}</span>}
                          </div>
                          {product.category && (
                            <p className="text-xs text-text-muted mt-1 truncate">{product.category}</p>
                          )}
                        </div>
                      </button>
                    ))}
                    {isLoadingMoreResults && (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
                      </div>
                    )}
                    {!isLoadingMoreResults && !hasMoreResults && searchResults.length > 0 && (
                      <p className="text-center text-xs text-text-muted py-2">No more results</p>
                    )}
                  </div>
                  <div className="border-t border-border-soft p-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleClearAll()
                        setView("form")
                      }}
                      className="w-full text-center text-sm font-medium text-brand hover:underline"
                    >
                      Can't find your product? Create new
                    </button>
                  </div>
                </div>
              )}

              {/* No Results */}
              {showDropdown && searchResults.length === 0 && !isSearching && debouncedSearchQuery.trim() && (
                <div
                  ref={dropdownRef}
                  className="relative z-10 w-full mt-2 bg-surface-elevated border border-border-soft rounded-xl shadow-xl p-6 text-center"
                >
                  <Search className="w-10 h-10 text-text-muted/70 mx-auto mb-3" />
                  <p className="text-text-secondary font-medium">No results found</p>
                  <p className="text-text-muted text-sm mt-1">No matching products for "{debouncedSearchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      handleClearAll()
                      setView("form")
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Product
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {view === "form" && (
        <>
          {/* Tabs */}
          <div className="bg-surface-elevated rounded-t-2xl shadow-sm border-b border-border-soft">
            <div className="flex space-x-8 px-8">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "basic"
                    ? "text-brand border-brand"
                    : "text-text-secondary border-transparent hover:text-brand"
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
                    ? "text-brand border-brand"
                    : "text-text-secondary border-transparent hover:text-brand"
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
                    ? "text-brand border-brand"
                    : "text-text-secondary border-transparent hover:text-brand"
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Media
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="create-product-form" onSubmit={handleSubmit}>
            <div className="bg-surface-elevated rounded-b-2xl shadow-lg p-8">
              {errors.submit && (
                <div className="mb-6 bg-destructive/10 border border-destructive/25 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-destructive">{errors.submit}</p>
                </div>
              )}

              {/* Basic Information Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                        Product Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className={`w-full px-4 py-3 border ${errors.name ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., Premium Dental Composite Kit"
                      />
                      {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="detailedName" className="block text-sm font-medium text-text-primary mb-2">
                        Detailed Name
                      </label>
                      <input
                        id="detailedName"
                        type="text"
                        name="detailedName"
                        value={formData.detailedName}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className={`w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., Premium Dental Composite Kit - 20 Shades with Applicators"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="barcode" className="block text-sm font-medium text-text-primary mb-2">
                        <Barcode className="w-4 h-4 inline mr-1" />
                        Barcode
                      </label>
                      <input
                        id="barcode"
                        type="text"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border ${errors.barcode ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., 8901234567890"
                      />
                      {errors.barcode && <p className="text-destructive text-sm mt-1">{errors.barcode}</p>}
                    </div>

                    <div>
                      <label htmlFor="barcodeFormats" className="block text-sm font-medium text-text-primary mb-2">
                        Barcode Format
                      </label>
                      <Select
                        name="barcodeFormats"
                        value={formData.barcodeFormats}
                        disabled={isProductSelected}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, barcodeFormats: value }))}
                      >
                        <SelectTrigger
                          id="barcodeFormats"
                          className="w-full rounded-lg border-border-soft bg-surface-elevated px-4 py-3 text-text-primary shadow-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:bg-surface disabled:opacity-60"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {barcodeFormatOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer mt-6">
                        <input
                          type="checkbox"
                          name="active"
                          checked={formData.active}
                          onChange={handleInputChange}
                          disabled={isProductSelected && !isEditMode}
                          className="w-5 h-5 text-brand border-border-soft rounded focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <span className="ml-3 text-sm font-medium text-text-primary">Product is Active</span>
                      </label>
                    </div>
                  </div>

                  {/* User Product Fields */}
                  {(!isEditMode || isReviewEditMode) && (
                    <div className="border-t border-border-soft pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-brand mb-4">Pricing & Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label htmlFor="skuCode" className="block text-sm font-medium text-text-primary mb-2">
                            SKU Code *
                          </label>
                          <input
                            id="skuCode"
                            type="text"
                            name="skuCode"
                            value={formData.skuCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
                            placeholder="e.g., SKU-12345"
                          />
                        </div>

                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-text-primary mb-2">
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
                            className={`w-full px-4 py-3 border ${errors.price ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.price && <p className="text-destructive text-sm mt-1">{errors.price}</p>}
                        </div>

                        <div>
                          <label htmlFor="stock" className="block text-sm font-medium text-text-primary mb-2">
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
                            className={`w-full px-4 py-3 border ${errors.stock ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="0"
                          />
                          {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock}</p>}
                        </div>

                        <div>
                          <label htmlFor="shipmentFee" className="block text-sm font-medium text-text-primary mb-2">
                            Shipment Fee *
                          </label>
                          <input
                            id="shipmentFee"
                            type="number"
                            name="shipmentFee"
                            value={formData.shipmentFee}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border ${errors.shipmentFee ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.shipmentFee && <p className="text-destructive text-sm mt-1">{errors.shipmentFee}</p>}
                        </div>

                        <div>
                          <label
                            htmlFor="heavyShippingSurcharge"
                            className="block text-sm font-medium text-text-primary mb-2"
                          >
                            Heavy Shipping Fee *
                          </label>
                          <input
                            id="heavyShippingSurcharge"
                            type="number"
                            name="heavyShippingSurcharge"
                            value={formData.heavyShippingSurcharge}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border ${errors.heavyShippingSurcharge ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.heavyShippingSurcharge && (
                            <p className="text-destructive text-sm mt-1">{errors.heavyShippingSurcharge}</p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="fulfillmentPolicy"
                            className="block text-sm font-medium text-text-primary mb-2"
                          >
                            Fulfillment Policy *
                          </label>
                          <input
                            id="fulfillmentPolicy"
                            type="text"
                            name="fulfillmentPolicy"
                            value={formData.fulfillmentPolicy}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
                            placeholder="e.g., Ships within 2 business days"
                          />
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="exportPackaging"
                              checked={formData.exportPackaging}
                              onChange={handleInputChange}
                              className="w-5 h-5 text-brand border-border-soft rounded focus:ring-ring/50"
                            />
                            <span className="ml-3 text-sm font-medium text-text-primary">Export Packaging</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Mode: Show Pricing & Inventory */}
                  {isEditMode && !isReviewEditMode && (
                    <div className="border-t border-border-soft pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-brand mb-4">Pricing & Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-text-primary mb-2">
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
                            className={`w-full px-4 py-3 border ${errors.price ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.price && <p className="text-destructive text-sm mt-1">{errors.price}</p>}
                        </div>

                        <div>
                          <label htmlFor="discount" className="block text-sm font-medium text-text-primary mb-2">
                            Discount <span className="text-text-muted font-normal">(Optional)</span>
                          </label>
                          <input
                            id="discount"
                            type="number"
                            name="discount"
                            value={editDiscount}
                            onChange={(e) => {
                              setEditDiscount(e.target.value)
                              if (errors.discount) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev }
                                  delete newErrors.discount
                                  return newErrors
                                })
                              }
                            }}
                            min="0"
                            step="0.01"
                            className={`w-full px-4 py-3 border ${errors.discount ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="0.00"
                          />
                          {errors.discount && <p className="text-destructive text-sm mt-1">{errors.discount}</p>}
                        </div>

                        <div>
                          <label htmlFor="stock" className="block text-sm font-medium text-text-primary mb-2">
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
                            className={`w-full px-4 py-3 border ${errors.stock ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="0"
                          />
                          {errors.stock && <p className="text-destructive text-sm mt-1">{errors.stock}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Product Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  <div className="bg-accent/45 border border-brand/25 rounded-lg p-4 flex items-start space-x-3">
                    <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                    <p className="text-accent-foreground text-sm">
                      These details provide additional information about your product and help buyers make informed
                      decisions.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
                      Detailed Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={isProductSelected}
                      rows={4}
                      className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent resize-none disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Detailed product description..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="manufacturerCode" className="block text-sm font-medium text-text-primary mb-2">
                        Manufacturer Code *
                      </label>
                      <input
                        id="manufacturerCode"
                        type="text"
                        name="manufacturerCode"
                        value={formData.manufacturerCode}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., MNF-4452"
                      />
                    </div>

                    <div>
                      <label htmlFor="manufacturer" className="block text-sm font-medium text-text-primary mb-2">
                        Manufacturer *
                      </label>
                      <input
                        id="manufacturer"
                        type="text"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., DentPro Inc."
                      />
                    </div>

                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-text-primary mb-2">
                        Brand *
                      </label>
                      <BrandFilterDropdown
                        id="brand"
                        value={formData.brand || null}
                        onChange={(brand) => setFormData((prev) => ({ ...prev, brand: brand ?? "" }))}
                        accessToken={accessToken}
                        disabled={isProductSelected}
                        hideAllOption
                        triggerClassName="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Categories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {(
                        [
                          "categoryLevel1",
                          "categoryLevel2",
                          "categoryLevel3",
                          "categoryLevel4",
                          "categoryLevel5",
                        ] as const
                      ).map((field, index) => (
                        <div key={field}>
                          <label htmlFor={field} className="block text-sm font-medium text-text-primary mb-2">
                            Level {index + 1}
                          </label>
                          <input
                            id={field}
                            type="text"
                            name={field}
                            value={formData[field]}
                            onChange={handleInputChange}
                            disabled={isProductSelected}
                            className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                            placeholder={`Category level ${index + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="manufacturerSiteProductPage"
                        className="block text-sm font-medium text-text-primary mb-2"
                      >
                        Manufacturer Site Product Page *
                      </label>
                      <input
                        id="manufacturerSiteProductPage"
                        type="url"
                        name="manufacturerSiteProductPage"
                        value={formData.manufacturerSiteProductPage}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="https://example.com/products/item"
                      />
                    </div>

                    <div>
                      <span className="block text-sm font-medium text-text-primary mb-2">
                        Dental License Required *
                      </span>
                      <label className="flex items-center gap-3 cursor-pointer mt-1">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formData.dentalLicenseRequired === "Yes"}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              dentalLicenseRequired: prev.dentalLicenseRequired === "Yes" ? "No" : "Yes",
                            }))
                          }
                          disabled={isProductSelected}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 ${
                            formData.dentalLicenseRequired === "Yes"
                              ? "bg-brand"
                              : "bg-surface-muted border border-border-soft"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              formData.dentalLicenseRequired === "Yes" ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-sm font-medium text-text-primary">
                          {formData.dentalLicenseRequired === "Yes" ? "Yes" : "No"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="reorderId" className="block text-sm font-medium text-text-primary mb-2">
                        Reorder ID *
                      </label>
                      <input
                        id="reorderId"
                        type="text"
                        name="reorderId"
                        value={formData.reorderId}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., RO-1001"
                      />
                    </div>

                    <div>
                      <label htmlFor="referanceNumber" className="block text-sm font-medium text-text-primary mb-2">
                        Reference Number *
                      </label>
                      <input
                        id="referanceNumber"
                        type="text"
                        name="referanceNumber"
                        value={formData.referanceNumber}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="e.g., REF-2024-01"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="exampleVariationsProductId"
                        className="block text-sm font-medium text-text-primary mb-2"
                      >
                        Example Variations Product ID
                      </label>
                      <input
                        id="exampleVariationsProductId"
                        type="text"
                        name="exampleVariationsProductId"
                        value={formData.exampleVariationsProductId}
                        onChange={handleInputChange}
                        disabled={isProductSelected}
                        className="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Related product ID"
                      />
                    </div>
                  </div>

                  {/* Dimensions & Weight */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Dimensions & Weight</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {(
                        [
                          ["height", "Height"],
                          ["length", "Length"],
                          ["width", "Width"],
                          ["weight", "Weight"],
                        ] as const
                      ).map(([field, label]) => (
                        <div key={field}>
                          <label htmlFor={field} className="block text-sm font-medium text-text-primary mb-2">
                            {field === "weight" ? `${label} *` : label}
                          </label>
                          <input
                            id={field}
                            type="number"
                            name={field}
                            value={formData[field]}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            disabled={isProductSelected}
                            className={`w-full px-4 py-3 border ${errors[field] ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                            placeholder="0.00"
                          />
                          {errors[field] && <p className="text-destructive text-sm mt-1">{errors[field]}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-text-primary">Attributes</h4>
                      <button
                        type="button"
                        onClick={() => setAttributes((prev) => [...prev, { attributeName: "", attributeValue: "" }])}
                        disabled={isProductSelected}
                        className="inline-flex items-center px-3 py-1.5 bg-surface text-text-primary text-sm rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Attribute
                      </button>
                    </div>

                    {attributes.length === 0 ? (
                      <p className="text-text-muted text-sm">
                        No attributes added. Use "Add Attribute" to define name/value pairs (e.g., Color / Blue).
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {attributes.map((attribute, index) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: rows are editable and have no stable id
                          <div key={index} className="flex items-center gap-4">
                            <input
                              type="text"
                              value={attribute.attributeName}
                              onChange={(e) =>
                                setAttributes((prev) =>
                                  prev.map((attr, i) =>
                                    i === index ? { ...attr, attributeName: e.target.value } : attr,
                                  ),
                                )
                              }
                              disabled={isProductSelected}
                              className="flex-1 px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Attribute name (e.g., Color)"
                            />
                            <input
                              type="text"
                              value={attribute.attributeValue}
                              onChange={(e) =>
                                setAttributes((prev) =>
                                  prev.map((attr, i) =>
                                    i === index ? { ...attr, attributeValue: e.target.value } : attr,
                                  ),
                                )
                              }
                              disabled={isProductSelected}
                              className="flex-1 px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Attribute value (e.g., Blue)"
                            />
                            <button
                              type="button"
                              onClick={() => setAttributes((prev) => prev.filter((_, i) => i !== index))}
                              disabled={isProductSelected}
                              className="w-8 h-8 shrink-0 bg-destructive/10 text-destructive rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="space-y-8">
                  {/* Cover Photo Section */}
                  <fieldset>
                    <legend className="block text-sm font-medium text-text-primary mb-2">
                      Cover Photo *<span className="text-text-muted font-normal ml-2">(Main product image)</span>
                    </legend>
                    <p className="text-text-muted text-sm mb-4">
                      Upload a high-quality cover image for your product, or add it via a link. This will be the
                      main image displayed.
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setCoverPhotoMode("upload")}
                        disabled={isProductSelected}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          coverPhotoMode === "upload"
                            ? "bg-brand text-white"
                            : "bg-surface text-text-secondary hover:bg-surface-muted"
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverPhotoMode("link")}
                        disabled={isProductSelected}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          coverPhotoMode === "link"
                            ? "bg-brand text-white"
                            : "bg-surface text-text-secondary hover:bg-surface-muted"
                        }`}
                      >
                        <Link2 className="w-4 h-4 mr-1.5" />
                        Add via Link
                      </button>
                    </div>

                    <input
                      ref={coverPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverPhotoChange}
                      disabled={isProductSelected}
                      className="hidden"
                      id="coverPhotoInput"
                    />

                    {fileData.coverPhotoPreview || existingImages.coverPhoto || linkedImages.coverPhoto ? (
                      <div className="relative inline-block">
                        <div className="w-48 h-48 bg-surface rounded-lg overflow-hidden border-2 border-brand">
                          <Image
                            src={fileData.coverPhotoPreview || existingImages.coverPhoto || linkedImages.coverPhoto || ""}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                            width={192}
                            height={192}
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E"
                            }}
                          />
                        </div>
                        <span className="absolute top-2 left-2 bg-brand text-white text-xs px-2 py-1 rounded">
                          {fileData.coverPhotoPreview ? "New Cover" : existingImages.coverPhoto ? "Existing" : "Link"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (fileData.coverPhotoPreview) {
                              removeCoverPhoto()
                            } else if (existingImages.coverPhoto) {
                              setExistingImages((prev) => ({ ...prev, coverPhoto: null }))
                            } else {
                              removeLinkedCoverPhoto()
                            }
                          }}
                          disabled={isProductSelected}
                          className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {coverPhotoMode === "upload" && fileData.coverPhotoPreview && (
                          <button
                            type="button"
                            onClick={() => coverPhotoInputRef.current?.click()}
                            className="absolute bottom-2 right-2 px-3 py-1 bg-surface-elevated text-text-primary text-xs rounded shadow hover:bg-surface-muted transition-colors"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    ) : coverPhotoMode === "upload" ? (
                      <button
                        type="button"
                        onClick={() => coverPhotoInputRef.current?.click()}
                        disabled={isProductSelected}
                        className="border-2 border-dashed border-border-soft rounded-lg p-8 text-center hover:border-brand hover:bg-surface-muted transition-colors cursor-pointer w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                        <p className="text-text-secondary font-medium">Click to upload cover photo</p>
                        <p className="text-text-muted text-sm mt-1">PNG, JPG, GIF up to 10MB</p>
                      </button>
                    ) : (
                      <div className="border-2 border-dashed border-border-soft rounded-lg p-6 w-full max-w-md">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={coverPhotoUrlInput}
                            onChange={(e) => {
                              setCoverPhotoUrlInput(e.target.value)
                              if (coverPhotoUrlError) setCoverPhotoUrlError("")
                            }}
                            disabled={isProductSelected}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-3 py-2 border border-border-soft rounded-lg text-sm bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={handleAddCoverPhotoLink}
                            disabled={isProductSelected}
                            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                        </div>
                        {coverPhotoUrlError && <p className="text-destructive text-sm mt-2">{coverPhotoUrlError}</p>}
                      </div>
                    )}
                  </fieldset>

                  {/* Additional Photos Section */}
                  <fieldset>
                    <legend className="block text-sm font-medium text-text-primary mb-2">
                      Additional Photos
                      <span className="text-text-muted font-normal ml-2">(Optional)</span>
                    </legend>
                    <p className="text-text-muted text-sm mb-4">
                      Upload additional product images to show different angles or details, or add them via a link.
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setPhotosMode("upload")}
                        disabled={isProductSelected}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          photosMode === "upload"
                            ? "bg-brand text-white"
                            : "bg-surface text-text-secondary hover:bg-surface-muted"
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-1.5" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotosMode("link")}
                        disabled={isProductSelected}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          photosMode === "link"
                            ? "bg-brand text-white"
                            : "bg-surface text-text-secondary hover:bg-surface-muted"
                        }`}
                      >
                        <Link2 className="w-4 h-4 mr-1.5" />
                        Add via Link
                      </button>
                    </div>

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
                      {photosMode === "upload" ? (
                        <button
                          type="button"
                          onClick={() => photosInputRef.current?.click()}
                          disabled={isProductSelected}
                          className="inline-flex items-center px-4 py-2 bg-surface text-text-primary rounded-lg hover:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Photos
                        </button>
                      ) : (
                        <div className="border-2 border-dashed border-border-soft rounded-lg p-4 max-w-md">
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={photoUrlInput}
                              onChange={(e) => {
                                setPhotoUrlInput(e.target.value)
                                if (photoUrlError) setPhotoUrlError("")
                              }}
                              disabled={isProductSelected}
                              placeholder="https://example.com/image.jpg"
                              className="flex-1 px-3 py-2 border border-border-soft rounded-lg text-sm bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                              type="button"
                              onClick={handleAddPhotoLink}
                              disabled={isProductSelected}
                              className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Add
                            </button>
                          </div>
                          {photoUrlError && <p className="text-destructive text-sm mt-2">{photoUrlError}</p>}
                        </div>
                      )}

                      {fileData.photosPreviews.length > 0 ||
                      existingImages.photos.length > 0 ||
                      linkedImages.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {/* Existing photos from selected product */}
                          {existingImages.photos.map((photo, index) => (
                            <div key={`existing-${photo}`} className="relative group">
                              <div className="aspect-square bg-surface rounded-lg overflow-hidden border border-border-soft">
                                <Image
                                  src={photo}
                                  alt={`Existing ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  width={192}
                                  height={192}
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E"
                                  }}
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
                                className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-0 disabled:cursor-not-allowed"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <span className="absolute bottom-2 left-2 bg-brand/80 text-white text-xs px-2 py-0.5 rounded">
                                Existing
                              </span>
                            </div>
                          ))}
                          {/* Newly uploaded photos */}
                          {fileData.photosPreviews.map((preview, index) => (
                            <div key={preview} className="relative group">
                              <div className="aspect-square bg-surface rounded-lg overflow-hidden border-2 border-success/60">
                                <Image
                                  src={preview}
                                  alt={`New ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  width={192}
                                  height={192}
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E"
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                disabled={isProductSelected}
                                className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-0 disabled:cursor-not-allowed"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <span className="absolute bottom-2 left-2 bg-success/80 text-white text-xs px-2 py-0.5 rounded">
                                New
                              </span>
                            </div>
                          ))}
                          {/* Linked photos */}
                          {linkedImages.photos.map((photo, index) => (
                            <div key={`link-${photo}`} className="relative group">
                              <div className="aspect-square bg-surface rounded-lg overflow-hidden border-2 border-brand/60">
                                <Image
                                  src={photo}
                                  alt={`Linked ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  width={192}
                                  height={192}
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E"
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLinkedPhoto(index)}
                                disabled={isProductSelected}
                                className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-0 disabled:cursor-not-allowed"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <span className="absolute bottom-2 left-2 bg-brand/80 text-white text-xs px-2 py-0.5 rounded">
                                Link
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border-soft rounded-lg p-8 text-center">
                          <ImageIcon className="w-10 h-10 text-text-muted/70 mx-auto mb-3" />
                          <p className="text-text-muted">No additional photos added</p>
                          <p className="text-text-muted/70 text-sm mt-1">
                            Click "Add Photos" or add an image link to add more images
                          </p>
                        </div>
                      )}
                    </div>
                  </fieldset>

                  {/* Upload Summary */}
                  {(fileData.coverPhoto ||
                    fileData.photos.length > 0 ||
                    existingImages.coverPhoto ||
                    existingImages.photos.length > 0 ||
                    linkedImages.coverPhoto ||
                    linkedImages.photos.length > 0) && (
                    <div className="bg-surface-muted rounded-lg p-4">
                      <h4 className="text-sm font-medium text-text-primary mb-2">Images Summary</h4>
                      <ul className="text-sm text-text-secondary space-y-1">
                        {existingImages.coverPhoto && !fileData.coverPhoto && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-brand mr-2" />
                            Cover photo: Existing image
                          </li>
                        )}
                        {fileData.coverPhoto && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-success mr-2" />
                            Cover photo: {fileData.coverPhoto.name} (new)
                          </li>
                        )}
                        {linkedImages.coverPhoto && !fileData.coverPhoto && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-brand mr-2" />
                            Cover photo: link
                          </li>
                        )}
                        {existingImages.photos.length > 0 && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-brand mr-2" />
                            Existing photos: {existingImages.photos.length} image(s)
                          </li>
                        )}
                        {fileData.photos.length > 0 && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-success mr-2" />
                            New photos: {fileData.photos.length} file(s)
                          </li>
                        )}
                        {linkedImages.photos.length > 0 && (
                          <li className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-brand mr-2" />
                            Linked photos: {linkedImages.photos.length} image(s)
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border-soft">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "details") setActiveTab("basic")
                    else if (activeTab === "media") setActiveTab("details")
                  }}
                  className={`px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium ${
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
                  className={`px-6 py-2 bg-accent-strong text-muted rounded-lg hover:bg-opacity-90 transition-colors font-medium ${
                    activeTab === "media" ? "invisible" : ""
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      {modalProduct && (
        <ProductDetailsModal
          product={modalProduct}
          isOpen={!!modalProduct}
          onClose={() => setModalProduct(null)}
          onSuccess={() => setModalProduct(null)}
        />
      )}
    </div>
  )
}

export default function CreateProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading...</p>
          </div>
        </div>
      }
    >
      <CreateProductPageContent />
    </Suspense>
  )
}
