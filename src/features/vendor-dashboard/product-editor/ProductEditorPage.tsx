"use client"

import { AlertCircle, Loader2 } from "lucide-react"
import { Suspense } from "react"
import AuthRequiredNotice from "./components/AuthRequiredNotice"
import BasicInfoTab from "./components/basic/BasicInfoTab"
import DetailsTab from "./components/details/DetailsTab"
import EditorHeader from "./components/EditorHeader"
import EditorNavigation from "./components/EditorNavigation"
import EditorTabs from "./components/EditorTabs"
import MediaTab from "./components/media/MediaTab"
import ProductDetailsModal from "./components/ProductDetailsModal"
import ProductSearchPanel from "./components/search/ProductSearchPanel"
import { useProductEditor } from "./hooks/useProductEditor"

const FORM_ID = "create-product-form"

/**
 * Create (search-first), plain edit (`?edit=`) and review edit (`?reviewEditId=&reviewUserProductId=`)
 * of a vendor product. All state lives in `useProductEditor`; this only lays out the sections.
 */
function ProductEditorContent() {
  const vm = useProductEditor()
  const { form, media, search, mode } = vm

  if (!vm.isSignedIn) return <AuthRequiredNotice onLogin={vm.goToLogin} />

  const fields = {
    values: form.values,
    errors: form.errors,
    locked: form.isProductSelected,
    onInputChange: form.handleInputChange,
  }

  return (
    <div className="p-0 sm:p-8">
      <EditorHeader
        mode={mode}
        showBackToSearch={vm.view === "form" && mode === "create"}
        onBackToSearch={vm.backToSearch}
        onCancel={vm.cancel}
      />

      {vm.view === "search" && (
        <ProductSearchPanel search={search} accessToken={vm.accessToken} onCreateNew={vm.startNewProduct} />
      )}

      {vm.view === "form" && (
        <>
          <EditorTabs activeTab={form.activeTab} errorCounts={vm.tabErrorCounts} onSelect={vm.goToTab} />

          <form id={FORM_ID} onSubmit={vm.handleSubmit}>
            <div className="bg-surface-elevated rounded-b-2xl shadow-lg p-4 sm:p-8">
              {form.errors.submit && (
                <div className="mb-6 bg-destructive/10 border border-destructive/25 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-destructive">{form.errors.submit}</p>
                </div>
              )}

              {form.activeTab === "basic" && (
                <BasicInfoTab
                  {...fields}
                  mode={mode}
                  discount={form.editDiscount}
                  onBarcodeFormatChange={form.setBarcodeFormat}
                  onDiscountChange={form.changeDiscount}
                />
              )}

              {form.activeTab === "details" && (
                <DetailsTab
                  {...fields}
                  accessToken={vm.accessToken}
                  attributes={form.attributes}
                  onBrandChange={form.setBrand}
                  onCategoryChange={form.setCategoryPath}
                  onToggleDentalLicense={form.toggleDentalLicense}
                  onAddAttribute={form.addAttribute}
                  onUpdateAttribute={form.updateAttribute}
                  onRemoveAttribute={form.removeAttribute}
                />
              )}

              {form.activeTab === "media" && (
                <MediaTab media={media} locked={form.isProductSelected} coverPhotoError={form.errors.coverPhoto} />
              )}

              <EditorNavigation
                activeTab={form.activeTab}
                mode={mode}
                isBusy={vm.isBusy}
                formId={FORM_ID}
                onPrevious={vm.goToPreviousTab}
                onNext={vm.goToNextTab}
              />
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
