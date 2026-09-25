"use client"

import { Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useId } from "react"
import SectionHeading from "@/components/layout/SectionHeading"
import AnimatedTabs from "@/components/ui/animated-tabs"
import { Button } from "@/components/ui/button"
import SurfaceCard from "@/components/ui/SurfaceCard"
import BulkDiscountModal from "./components/BulkDiscountModal"
import { useProductColumns } from "./components/columns"
import DeleteProductModal from "./components/DeleteProductModal"
import ProductDetailModal from "./components/ProductDetailModal"
import ProductStatsCards from "./components/ProductStatsCards"
import ProductsPagination from "./components/ProductsPagination"
import ProductsTable from "./components/ProductsTable"
import ProductsToolbar from "./components/ProductsToolbar"
import { BRAND_FILTER_ALL } from "./hooks/useProductListQuery"
import { useVendorProductsPage } from "./hooks/useVendorProductsPage"
import ImportDocumentsModal from "./import-documents/components/ImportDocumentsModal"
import type { ViewMode } from "./types"

const VIEW_MODE_TABS: ReadonlyArray<{ label: string; value: ViewMode }> = [
  { label: "All Products", value: "products" },
  { label: "Review Queue", value: "review" },
]

export default function ProductsPage() {
  const id = useId()
  const router = useRouter()
  const page = useVendorProductsPage()
  const { listQuery, mutations } = page

  // Stabilized with `useCallback` for the same reason the hooks' own handlers are — see
  // `components/columns.tsx`.
  const handleEditSave = useCallback(
    (product: Parameters<typeof mutations.saveEdit>[0]) => void mutations.saveEdit(product),
    [mutations.saveEdit],
  )
  const handleResubmit = useCallback(
    (product: { productId: string; id: string }) =>
      router.push(
        `/vendor-dashboard/products/create?reviewEditId=${product.productId}&reviewUserProductId=${product.id}`,
      ),
    [router],
  )

  const columns = useProductColumns({
    viewMode: listQuery.viewMode,
    sortField: listQuery.sortField,
    sortDirection: listQuery.sortDirection,
    onSort: listQuery.handleSort,
    editingProductId: mutations.editingProductId,
    editingDraft: mutations.editingDraft,
    savingProductId: mutations.savingProductId,
    canSaveDraft: mutations.canSaveDraft,
    onDraftChange: mutations.updateDraft,
    onEditStart: mutations.startEdit,
    onEditSave: handleEditSave,
    onEditCancel: mutations.cancelEdit,
    onDelete: page.openDeleteModal,
    onViewDetails: page.openDetailModal,
    onResubmit: handleResubmit,
    imageFallbacks: page.imageFallbacks,
    onImageError: page.handleImageError,
  })

  if (!page.isAuthenticated) {
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
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Product Management"
          description="Manage your entire product catalog, inventory, and pricing"
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg px-4 font-medium dark:text-neutral-800"
                onClick={page.openImportModal}
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
          }
        />

        {/* View Mode Tabs */}
        <div className="mt-6 mb-6">
          <AnimatedTabs<ViewMode>
            value={listQuery.viewMode}
            options={VIEW_MODE_TABS}
            onValueChange={listQuery.handleViewModeChange}
            disabled={listQuery.isLoading || listQuery.isFetching}
            className="self-start"
          />
        </div>

        {/* Stats Cards */}
        {listQuery.viewMode === "products" && (
          <ProductStatsCards selectedFilter={listQuery.selectedFilter} onFilterChange={listQuery.handleFilterChange} />
        )}
      </section>

      {/* Products Table + Filters */}
      <SurfaceCard as="section" id={`${id}-products-table-section`} variant="glass" className="mb-6 overflow-hidden">
        <ProductsToolbar
          viewMode={listQuery.viewMode}
          searchQuery={listQuery.searchQuery}
          onSearchChange={listQuery.handleSearchChange}
          selectedPeriodTab={listQuery.selectedPeriodTab}
          onPeriodTabChange={listQuery.handlePeriodTabChange}
          controlsDisabled={listQuery.isLoading || listQuery.isFetching}
          selectedBrand={listQuery.selectedBrand}
          brandFilterAll={BRAND_FILTER_ALL}
          brandOptions={page.brandOptions}
          onBrandChange={listQuery.handleBrandChange}
          reviewApprovedFilter={listQuery.reviewApprovedFilter}
          onReviewApprovedFilterChange={listQuery.handleReviewApprovedFilterChange}
          totalElements={listQuery.totalElements}
          currentPage={listQuery.currentPage}
          pageSize={listQuery.pageSize}
          selectedCount={page.selectedProductIds.length}
          onClearSelection={page.clearSelection}
          onOpenBulkDiscount={page.openBulkDiscountModal}
        />

        <ProductsTable
          columns={columns}
          rows={listQuery.rows}
          isLoading={listQuery.isLoading}
          isFetching={listQuery.isFetching}
          fetchError={listQuery.fetchError}
          onRetry={listQuery.refetch}
          selectedProductIds={page.selectedProductIds}
          editingProductId={mutations.editingProductId}
          onRowClick={page.handleRowClick}
        />

        <ProductsPagination
          pageSize={listQuery.pageSize}
          onPageSizeChange={listQuery.handlePageSizeChange}
          currentPage={listQuery.currentPage}
          totalPages={listQuery.totalPages}
          onPageChange={listQuery.handlePageChange}
        />
      </SurfaceCard>

      <ImportDocumentsModal isOpen={page.isImportModalOpen} onClose={page.closeImportModal} />

      <BulkDiscountModal
        isOpen={page.isBulkDiscountModalOpen}
        onClose={page.closeBulkDiscountModal}
        selectedCount={page.selectedProductIds.length}
        value={page.bulkDiscountValue}
        onValueChange={page.setBulkDiscountValue}
        isApplying={mutations.isApplyingBulkDiscount}
        onApply={() => void page.confirmBulkDiscount()}
      />

      <DeleteProductModal
        isOpen={page.deleteModal.isOpen}
        onClose={page.closeDeleteModal}
        onConfirm={() => void page.confirmDelete()}
        productName={page.deleteModal.productName}
      />

      {page.detailModalProduct && (
        <ProductDetailModal
          productId={page.detailModalProduct.productId}
          userProductId={page.detailModalProduct.id}
          productName={page.detailModalProduct.productName}
          onClose={page.closeDetailModal}
        />
      )}
    </>
  )
}
