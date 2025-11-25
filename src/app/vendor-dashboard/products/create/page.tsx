"use client"

import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Info,
  Package,
  Plus,
  Save,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { type CreateProductDetailsPayload, type CreateProductPayload, productsAPI } from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"
import VendorHeader from "../../components/VendorHeader"
import VendorSidebar from "../../components/VendorSidebar"

interface FormData {
  // Product fields
  name: string
  detailedName: string
  aboutProduct: string
  photoPaths: string[]
  subCategoriesId: string
  customerReviews: string
  barcode: string
  barcodeFormats: string
  active: boolean
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
}

const initialFormData: FormData = {
  name: "Premium Dental Mirror",
  detailedName: "Premium Dental Mirror - Stainless Steel with Anti-Fog Coating",
  aboutProduct:
    "High-quality dental mirror designed for professional use. Features anti-fog coating and ergonomic handle for precise examinations.",
  photoPaths: ["https://m.media-amazon.com/images/I/41RPV8dOfPL._AC_UF1000,1000_QL80_.jpg"],
  subCategoriesId: "dental-tools",
  customerReviews: "Excellent quality mirror, very clear reflection!",
  barcode: "123456789",
  barcodeFormats: "EAN_13",
  active: true,
  description:
    "Professional grade dental mirror with 5x magnification. Made from surgical-grade stainless steel with scratch-resistant glass.",
  manufacturerCode: "DM-PRO-001",
  brand: "DentPro",
  packaging: "Box of 10",
  primaryMarket: "Dental Clinics",
  scent: "Neutral",
  size: "Standard",
  type: "Disposable",
  sds: "https://example.com/sds/dental-mirror.pdf",
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
  const { accessToken, isAuthenticated, user } = useAuthStore()

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [newImageUrl, setNewImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "media">("basic")

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

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        photoPaths: [...prev.photoPaths, newImageUrl.trim()],
      }))
      setNewImageUrl("")
    }
  }

  const removeImageUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photoPaths: prev.photoPaths.filter((_, i) => i !== index),
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

    if (!formData.aboutProduct.trim()) {
      newErrors.aboutProduct = "Product description is required"
    }

    if (!formData.barcode.trim()) {
      newErrors.barcode = "Barcode is required"
    } else if (Number.isNaN(Number(formData.barcode))) {
      newErrors.barcode = "Barcode must be a number"
    }

    if (!formData.subCategoriesId.trim()) {
      newErrors.subCategoriesId = "Category is required"
    }

    setErrors(newErrors)
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
      // Create the product
      const productPayload: CreateProductPayload = {
        name: formData.name,
        detailedName: formData.detailedName,
        aboutProduct: formData.aboutProduct,
        photoPaths: formData.photoPaths.join(","),
        subCategoriesId: formData.subCategoriesId,
        customerReviews: formData.customerReviews,
        barcode: Number(formData.barcode),
        barcodeFormats: formData.barcodeFormats,
        active: formData.active,
      }

      // Try with token if available, otherwise try without (might use cookies)
      const createdProduct = await productsAPI.createProduct(productPayload, accessToken || "")

      // If product details are provided, create them as well
      if (
        formData.description ||
        formData.manufacturerCode ||
        formData.brand ||
        formData.packaging ||
        formData.primaryMarket
      ) {
        const detailsPayload: CreateProductDetailsPayload = {
          productId: createdProduct.id,
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

        await productsAPI.createProductDetails(detailsPayload, accessToken || "")
      }

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/vendor-dashboard")
      }, 2000)
    } catch (error: unknown) {
      const err = error as { message?: string }
      setErrors({ submit: err.message || "Failed to create product. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-light-mint-gray">
        <VendorHeader />
        <div className="flex flex-1">
          <VendorSidebar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-steel-blue mb-4">Product Created Successfully!</h2>
              <p className="text-gray-600 mb-6">Your product has been added to the catalog.</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          </main>
        </div>
      </div>
    )
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
                href="/vendor-dashboard"
                className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-steel-blue">Create New Product</h1>
                <p className="text-gray-600">Add a new product to your catalog</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push("/vendor-dashboard")}
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
                {isLoading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </div>

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
                        className={`w-full px-4 py-3 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
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
                        className={`w-full px-4 py-3 border ${errors.detailedName ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
                        placeholder="e.g., Premium Dental Composite Kit - 20 Shades with Applicators"
                      />
                      {errors.detailedName && <p className="text-red-500 text-sm mt-1">{errors.detailedName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="aboutProduct" className="block text-sm font-medium text-gray-700 mb-2">
                      About Product *
                    </label>
                    <textarea
                      id="aboutProduct"
                      name="aboutProduct"
                      value={formData.aboutProduct}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border ${errors.aboutProduct ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none`}
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
                        className={`w-full px-4 py-3 border ${errors.subCategoriesId ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className={`w-full px-4 py-3 border ${errors.barcode ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent`}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                          className="w-5 h-5 text-steel-blue border-gray-300 rounded focus:ring-steel-blue"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">Product is Active</span>
                      </label>
                    </div>
                  </div>
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
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                        placeholder="https://example.com/sds/product.pdf"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-2">Product Images</legend>
                    <p className="text-gray-500 text-sm mb-4">
                      Add image URLs for your product. The first image will be used as the main product image.
                    </p>

                    <div className="flex space-x-3 mb-4">
                      <input
                        type="url"
                        id="newImageUrl"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addImageUrl()
                          }
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                        placeholder="Enter image URL and press Enter or click Add"
                        aria-label="Image URL"
                      />
                      <button
                        type="button"
                        onClick={addImageUrl}
                        className="px-4 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </button>
                    </div>

                    {formData.photoPaths.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.photoPaths.map((url) => (
                          <div key={`image-${url}`} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              {/* Using img for external user-provided URLs that may be from any domain */}
                              <Image
                                src={url}
                                alt="Product preview"
                                className="w-full h-full object-cover"
                                width={100}
                                height={100}
                              />
                            </div>
                            {formData.photoPaths.indexOf(url) === 0 && (
                              <span className="absolute top-2 left-2 bg-steel-blue text-white text-xs px-2 py-1 rounded">
                                Main
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImageUrl(formData.photoPaths.indexOf(url))}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No images added yet</p>
                        <p className="text-gray-400 text-sm">Add image URLs above to display product photos</p>
                      </div>
                    )}
                  </fieldset>
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
