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
import { Suspense } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import BrandFilterDropdown from "./components/BrandFilterDropdown"
import CategoryPicker from "./components/CategoryPicker"
import ProductDetailsModal from "./components/ProductDetailsModal"
import { useProductEditor } from "./hooks/useProductEditor"
import {
  FULFILLMENT_POLICY_DAYS,
  getFulfillmentPolicyDayUnit,
  getFulfillmentPolicyValue,
  parseFulfillmentPolicyDays,
} from "./lib/fulfillment-policy"
import { BARCODE_FORMAT_OPTIONS } from "./lib/product-form"

const blockInvalidNumberKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault()
  }
}

const blockInvalidNumberPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const pastedText = e.clipboardData.getData("text")
  if (!/^\d*\.?\d*$/.test(pastedText)) {
    e.preventDefault()
  }
}

function ProductEditorContent() {
  const vm = useProductEditor()
  const { form, media, search, mode, view } = vm

  // Redirect to login if not authenticated
  if (!vm.isSignedIn) {
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
            onClick={vm.goToLogin}
            className="w-full bg-brand text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Interim aliases for the not-yet-split JSX below (S10 d replaces it with section components).
  const isEditMode = mode === "edit"
  const isReviewEditMode = mode === "reviewEdit"
  const { values: formData, errors, activeTab, isProductSelected, editDiscount, attributes, handleInputChange } = form
  const { photoFiles: fileData, existingImages, linkedImages, coverPhotoMode, photosMode } = media
  const { coverPhotoUrlInput, coverPhotoUrlError, photoUrlInput, photoUrlError } = media
  const { basic: basicErrorCount, details: detailsErrorCount, media: mediaErrorCount } = vm.tabErrorCounts

  return (
    <div className="p-0 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/vendor-dashboard/products"
            aria-label="Back to products"
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
        <div className="flex flex-wrap gap-3">
          {view === "form" && !isEditMode && !isReviewEditMode && (
            <button
              type="button"
              onClick={vm.backToSearch}
              className="px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </button>
          )}
          <button
            type="button"
            onClick={vm.cancel}
            className="px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium"
          >
            Cancel
          </button>
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
                <BrandFilterDropdown
                  value={search.selectedBrand}
                  onChange={search.setSelectedBrand}
                  accessToken={vm.accessToken}
                />

                <div className="relative flex-1">
                  <input
                    ref={search.searchInputRef}
                    type="text"
                    value={search.searchQuery}
                    onChange={(e) => search.setSearchQuery(e.target.value)}
                    onFocus={search.reopenDropdown}
                    placeholder="Search by barcode, name, detailed name, or manufacturer code..."
                    className="w-full px-4 py-3 pl-12 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {search.isSearching ? (
                      <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                  {search.searchQuery && (
                    <button
                      type="button"
                      onClick={search.clearQuery}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results Panel */}
              {search.showDropdown && search.results.length > 0 && (
                <div
                  ref={search.dropdownRef}
                  className="relative z-10 w-full mt-2 bg-surface-elevated border border-border-soft rounded-xl shadow-xl"
                >
                  <div
                    ref={search.resultsListRef}
                    onScroll={search.handleResultsScroll}
                    className="p-2 max-h-96 overflow-y-auto"
                  >
                    <p className="px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
                      {search.results.length} results found
                    </p>
                    {search.results.map((product) => (
                      <button
                        key={`${product.source}-${product.id}`}
                        type="button"
                        disabled={search.loadingDetailId === product.id}
                        onClick={() => search.selectResult(product)}
                        className="w-full flex items-center space-x-4 p-3 hover:bg-surface-muted rounded-lg transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden shrink-0">
                          {product.images.length > 0 &&
                          !search.brokenImageIds.has(`${product.source}-${product.id}`) ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              onError={() => search.markImageBroken(`${product.source}-${product.id}`)}
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
                    {search.isLoadingMore && (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
                      </div>
                    )}
                    {!search.isLoadingMore && !search.hasMore && search.results.length > 0 && (
                      <p className="text-center text-xs text-text-muted py-2">No more results</p>
                    )}
                  </div>
                  <div className="border-t border-border-soft p-3">
                    <button
                      type="button"
                      onClick={vm.startNewProduct}
                      className="w-full text-center text-sm font-medium text-brand hover:underline"
                    >
                      Can't find your product? Create new
                    </button>
                  </div>
                </div>
              )}

              {/* No Results */}
              {search.showDropdown &&
                search.results.length === 0 &&
                !search.isSearching &&
                search.debouncedQuery.trim() && (
                  <div
                    ref={search.dropdownRef}
                    className="relative z-10 w-full mt-2 bg-surface-elevated border border-border-soft rounded-xl shadow-xl p-6 text-center"
                  >
                    <Search className="w-10 h-10 text-text-muted/70 mx-auto mb-3" />
                    <p className="text-text-secondary font-medium">No results found</p>
                    <p className="text-text-muted text-sm mt-1">No matching products for "{search.debouncedQuery}"</p>
                    <button
                      type="button"
                      onClick={vm.startNewProduct}
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
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 sm:gap-8 sm:px-8">
              <button
                type="button"
                onClick={() => vm.goToTab("basic")}
                className={`shrink-0 whitespace-nowrap py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "basic"
                    ? "text-brand border-brand"
                    : basicErrorCount > 0
                      ? "text-destructive border-transparent hover:text-brand"
                      : "text-text-secondary border-transparent hover:text-brand"
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Basic Information
                {basicErrorCount > 0 && (
                  <span className="inline-flex" title={`${basicErrorCount} error${basicErrorCount === 1 ? "" : "s"}`}>
                    <AlertCircle
                      className="w-4 h-4 inline ml-2 text-destructive"
                      aria-label={`${basicErrorCount} error${basicErrorCount === 1 ? "" : "s"}`}
                    />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => vm.goToTab("details")}
                className={`shrink-0 whitespace-nowrap py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "details"
                    ? "text-brand border-brand"
                    : detailsErrorCount > 0
                      ? "text-destructive border-transparent hover:text-brand"
                      : "text-text-secondary border-transparent hover:text-brand"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Product Details
                {detailsErrorCount > 0 && (
                  <span
                    className="inline-flex"
                    title={`${detailsErrorCount} error${detailsErrorCount === 1 ? "" : "s"}`}
                  >
                    <AlertCircle
                      className="w-4 h-4 inline ml-2 text-destructive"
                      aria-label={`${detailsErrorCount} error${detailsErrorCount === 1 ? "" : "s"}`}
                    />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => vm.goToTab("media")}
                className={`shrink-0 whitespace-nowrap py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "media"
                    ? "text-brand border-brand"
                    : mediaErrorCount > 0
                      ? "text-destructive border-transparent hover:text-brand"
                      : "text-text-secondary border-transparent hover:text-brand"
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Media
                {mediaErrorCount > 0 && (
                  <span className="inline-flex" title={`${mediaErrorCount} error${mediaErrorCount === 1 ? "" : "s"}`}>
                    <AlertCircle
                      className="w-4 h-4 inline ml-2 text-destructive"
                      aria-label={`${mediaErrorCount} error${mediaErrorCount === 1 ? "" : "s"}`}
                    />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Form */}
          <form id="create-product-form" onSubmit={vm.handleSubmit}>
            <div className="bg-surface-elevated rounded-b-2xl shadow-lg p-4 sm:p-8">
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
                        onValueChange={form.setBarcodeFormat}
                      >
                        <SelectTrigger
                          id="barcodeFormats"
                          className="w-full rounded-lg border-border-soft bg-surface-elevated px-4 py-3 text-text-primary shadow-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:bg-surface disabled:opacity-60"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BARCODE_FORMAT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                            className={`w-full px-4 py-3 border ${errors.skuCode ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent`}
                            placeholder="e.g., SKU-12345"
                          />
                          {errors.skuCode && <p className="text-destructive text-sm mt-1">{errors.skuCode}</p>}
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
                          <div
                            className={`flex min-h-12 flex-wrap items-center gap-3 rounded-lg border bg-surface-elevated px-4 py-3 text-sm ${errors.fulfillmentPolicy ? "border-destructive" : "border-border-soft"}`}
                          >
                            <span className="text-text-primary">Ships within</span>
                            <select
                              id="fulfillmentPolicy"
                              name="fulfillmentPolicy"
                              value={formData.fulfillmentPolicy}
                              onChange={handleInputChange}
                              className="h-8 rounded-md border border-border-soft bg-surface-elevated px-2 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-ring/50"
                            >
                              <option value="">Select</option>
                              {FULFILLMENT_POLICY_DAYS.map((days) => (
                                <option key={days} value={getFulfillmentPolicyValue(days)}>
                                  {days}
                                </option>
                              ))}
                            </select>
                            <span className="text-text-primary">
                              {getFulfillmentPolicyDayUnit(parseFulfillmentPolicyDays(formData.fulfillmentPolicy))}
                            </span>
                          </div>
                          {errors.fulfillmentPolicy && (
                            <p className="text-destructive text-sm mt-1">{errors.fulfillmentPolicy}</p>
                          )}
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
                            onChange={(e) => form.changeDiscount(e.target.value)}
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
                        className={`w-full px-4 py-3 border ${errors.manufacturerCode ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., MNF-4452"
                      />
                      {errors.manufacturerCode && (
                        <p className="text-destructive text-sm mt-1">{errors.manufacturerCode}</p>
                      )}
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
                        className={`w-full px-4 py-3 border ${errors.manufacturer ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="e.g., DentPro Inc."
                      />
                      {errors.manufacturer && <p className="text-destructive text-sm mt-1">{errors.manufacturer}</p>}
                    </div>

                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-text-primary mb-2">
                        Brand *
                      </label>
                      <BrandFilterDropdown
                        id="brand"
                        value={formData.brand || null}
                        onChange={form.setBrand}
                        accessToken={vm.accessToken}
                        disabled={isProductSelected}
                        hideAllOption
                        triggerClassName={`w-full px-4 py-3 border ${errors.brand ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                      />
                      {errors.brand && <p className="text-destructive text-sm mt-1">{errors.brand}</p>}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <CategoryPicker
                      id="category"
                      value={formData.categoryPath}
                      legacyValue={formData.legacyCategory}
                      hasError={Boolean(errors.category)}
                      disabled={isProductSelected}
                      onChange={form.setCategoryPath}
                      // The picker itself marks only the first empty level red (aria-invalid), so the
                      // shared trigger class must stay neutral - a conditional border here would paint
                      // every level's dropdown red at once.
                      triggerClassName="w-full px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {errors.category && <p className="text-destructive text-sm mt-1">{errors.category}</p>}
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
                        className={`w-full px-4 py-3 border ${errors.manufacturerSiteProductPage ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                        placeholder="https://example.com/products/item"
                      />
                      {errors.manufacturerSiteProductPage && (
                        <p className="text-destructive text-sm mt-1">{errors.manufacturerSiteProductPage}</p>
                      )}
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
                          onClick={form.toggleDentalLicense}
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
                            onKeyDown={blockInvalidNumberKey}
                            onPaste={blockInvalidNumberPaste}
                            min="0"
                            step="0.01"
                            inputMode="decimal"
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
                        onClick={form.addAttribute}
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
                              onChange={(e) => form.updateAttribute(index, { attributeName: e.target.value })}
                              disabled={isProductSelected}
                              className="flex-1 px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Attribute name (e.g., Color)"
                            />
                            <input
                              type="text"
                              value={attribute.attributeValue}
                              onChange={(e) => form.updateAttribute(index, { attributeValue: e.target.value })}
                              disabled={isProductSelected}
                              className="flex-1 px-4 py-3 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                              placeholder="Attribute value (e.g., Blue)"
                            />
                            <button
                              type="button"
                              onClick={() => form.removeAttribute(index)}
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
                      className={`w-full px-4 py-3 border ${errors.description ? "border-destructive" : "border-border-soft"} rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent resize-none disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
                      placeholder="Detailed product description..."
                    />
                    {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
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
                      Upload a high-quality cover image for your product, or add it via a link. This will be the main
                      image displayed.
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => media.setCoverPhotoMode("upload")}
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
                        onClick={() => media.setCoverPhotoMode("link")}
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
                      ref={media.coverPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={media.handleCoverPhotoChange}
                      disabled={isProductSelected}
                      className="hidden"
                      id="coverPhotoInput"
                    />

                    {fileData.coverPhotoPreview || existingImages.coverPhoto || linkedImages.coverPhoto ? (
                      <div className="relative inline-block">
                        <div className="w-48 h-48 bg-surface rounded-lg overflow-hidden border-2 border-brand">
                          <Image
                            src={
                              fileData.coverPhotoPreview || existingImages.coverPhoto || linkedImages.coverPhoto || ""
                            }
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
                          onClick={media.removeCoverPhoto}
                          disabled={isProductSelected}
                          className="absolute top-2 right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {coverPhotoMode === "upload" && fileData.coverPhotoPreview && (
                          <button
                            type="button"
                            onClick={media.openCoverPhotoPicker}
                            className="absolute bottom-2 right-2 px-3 py-1 bg-surface-elevated text-text-primary text-xs rounded shadow hover:bg-surface-muted transition-colors"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    ) : coverPhotoMode === "upload" ? (
                      <button
                        type="button"
                        onClick={media.openCoverPhotoPicker}
                        disabled={isProductSelected}
                        className="border-2 border-dashed border-border-soft rounded-lg p-8 text-center hover:border-brand hover:bg-surface-muted transition-colors cursor-pointer w-full max-w-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                        <p className="text-text-secondary font-medium">Click to upload cover photo</p>
                        <p className="text-text-muted text-sm mt-1">PNG, JPG, GIF — up to 1MB each, 10MB in total</p>
                      </button>
                    ) : (
                      <div className="border-2 border-dashed border-border-soft rounded-lg p-6 w-full max-w-md">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={coverPhotoUrlInput}
                            onChange={(e) => media.changeCoverPhotoUrl(e.target.value)}
                            disabled={isProductSelected}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-3 py-2 border border-border-soft rounded-lg text-sm bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={media.addCoverPhotoLink}
                            disabled={isProductSelected}
                            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                        </div>
                        {coverPhotoUrlError && <p className="text-destructive text-sm mt-2">{coverPhotoUrlError}</p>}
                      </div>
                    )}
                    {errors.coverPhoto && <p className="text-destructive text-sm mt-2">{errors.coverPhoto}</p>}
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
                        onClick={() => media.setPhotosMode("upload")}
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
                        onClick={() => media.setPhotosMode("link")}
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
                      ref={media.photosInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={media.handlePhotosChange}
                      disabled={isProductSelected}
                      className="hidden"
                      id="photosInput"
                    />

                    <div className="space-y-4">
                      {photosMode === "upload" ? (
                        <button
                          type="button"
                          onClick={media.openPhotosPicker}
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
                              onChange={(e) => media.changePhotoUrl(e.target.value)}
                              disabled={isProductSelected}
                              placeholder="https://example.com/image.jpg"
                              className="flex-1 px-3 py-2 border border-border-soft rounded-lg text-sm bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                              type="button"
                              onClick={media.addPhotoLink}
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
                                onClick={() => media.removeExistingPhoto(index)}
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
                                onClick={() => media.removePhoto(index)}
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
                                onClick={() => media.removeLinkedPhoto(index)}
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
                    if (activeTab === "details") vm.goToTab("basic")
                    else if (activeTab === "media") vm.goToTab("details")
                  }}
                  className={`px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium ${
                    activeTab === "basic" ? "invisible" : ""
                  }`}
                >
                  Previous
                </button>
                {activeTab === "media" ? (
                  <button
                    type="submit"
                    form="create-product-form"
                    disabled={vm.isBusy}
                    className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {vm.isBusy
                      ? isReviewEditMode
                        ? "Resubmitting..."
                        : isEditMode
                          ? "Updating..."
                          : "Submitting..."
                      : isReviewEditMode
                        ? "Resubmit for Review"
                        : isEditMode
                          ? "Update Product"
                          : "Submit"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "basic") vm.goToTab("details")
                      else if (activeTab === "details") vm.goToTab("media")
                    }}
                    className="px-6 py-2 bg-accent-strong text-muted rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </form>
        </>
      )}

      {search.modalProduct && (
        <ProductDetailsModal
          product={search.modalProduct}
          isOpen={!!search.modalProduct}
          onClose={search.closeModal}
          onSuccess={search.closeModal}
        />
      )}
    </div>
  )
}

export default function ProductEditorPage() {
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
      <ProductEditorContent />
    </Suspense>
  )
}
