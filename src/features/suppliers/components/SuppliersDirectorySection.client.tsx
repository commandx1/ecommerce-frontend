"use client"

import { ChevronDown, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SupplierDirectoryCard from "@/features/suppliers/components/SupplierDirectoryCard"
import {
  supplierCategories,
  supplierTestimonials,
  supplierTrustItems,
} from "@/features/suppliers/suppliersPageData"
import { type VendorListParams, addVendorFavorite, getMyFavoriteVendorIds, getVendors, removeVendorFavorite } from "@/lib/api/vendors"
import { showToast } from "@/components/ui/Toast"
import type { VendorListItem } from "@/lib/api/vendors"
import { useAuthStore } from "@/stores/authStore"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 6

const ratingOptions = ["Rating: All", "4+ Stars", "3+ Stars"] as const
const sortOptions = ["Highest Rated", "Most Reviews", "A-Z"] as const

type RatingOption = (typeof ratingOptions)[number]
type SortOption = (typeof sortOptions)[number]

const numericFormatter = new Intl.NumberFormat("en-US")

function toApiSort(sort: SortOption): VendorListParams["sort"] {
  if (sort === "Most Reviews") return "reviewCount"
  if (sort === "A-Z") return "name"
  return "rating"
}

function toApiMinRating(rating: RatingOption): number | undefined {
  if (rating === "4+ Stars") return 4
  if (rating === "3+ Stars") return 3
  return undefined
}

function vendorToSupplierItem(vendor: VendorListItem) {
  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    about: "",
    rating: vendor.averageRating,
    reviewCount: vendor.reviewCount,
  }
}

export default function SuppliersDirectorySection() {
  const { isAuthenticated } = useAuthStore()

  const [selectedRating, setSelectedRating] = useState<RatingOption>("Rating: All")
  const [selectedSort, setSelectedSort] = useState<SortOption>("Highest Rated")
  const [currentPage, setCurrentPage] = useState(1)

  const [vendors, setVendors] = useState<VendorListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const favoriteIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    favoriteIdsRef.current = favoriteIds
  }, [favoriteIds])

  useEffect(() => {
    if (!isAuthenticated) return
    getMyFavoriteVendorIds()
      .then((ids) => setFavoriteIds(new Set(ids)))
      .catch(() => {})
  }, [isAuthenticated])

  const handleToggleFavorite = useCallback(
    async (vendorId: string) => {
      if (!isAuthenticated) {
        showToast.warning("Login required", "Please sign in to save vendors to your favorites.")
        return
      }
      const isFav = favoriteIdsRef.current.has(vendorId)
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (isFav) next.delete(vendorId)
        else next.add(vendorId)
        return next
      })
      try {
        if (isFav) await removeVendorFavorite(vendorId)
        else await addVendorFavorite(vendorId)
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (isFav) next.add(vendorId)
          else next.delete(vendorId)
          return next
        })
      }
    },
    [isAuthenticated],
  )

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setHasError(false)
    getVendors({
      page: currentPage - 1,
      size: ITEMS_PER_PAGE,
      sort: toApiSort(selectedSort),
      minRating: toApiMinRating(selectedRating),
      signal: controller.signal,
    })
      .then((result) => {
        setVendors(result.vendors)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      })
      .catch(() => {
        if (!controller.signal.aborted) setHasError(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [currentPage, selectedSort, selectedRating])


  const supplierItems = useMemo(() => vendors.map(vendorToSupplierItem), [vendors])

  const currentStart = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const currentEnd = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)

  return (
    <>
      <section className="relative overflow-hidden bg-brand-surface py-18 text-inverse-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 mesh-panel opacity-50" />
        <PageSectionContainer>
          <div className="relative max-w-4xl">
            <h1 className="text-4xl font-semibold leading-[1.02] text-inverse-foreground md:text-6xl">
              Trusted Dental Vendors
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-inverse-muted md:text-xl">
              Connect with verified vendors offering quality dental products and equipment across the United States.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroMetric value="450+" label="Verified Vendors" />
              <HeroMetric value="98%" label="Satisfaction Rate" />
              <HeroMetric value="24/7" label="Support Available" />
            </div>
          </div>
        </PageSectionContainer>
      </section>

      <section className="sticky top-20 z-30 border-y border-border-soft/80 bg-surface/90 py-5 backdrop-blur-xl">
        <PageSectionContainer>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                value={selectedRating}
                onChange={(event) => {
                  setSelectedRating(event.target.value as RatingOption)
                  setCurrentPage(1)
                }}
                options={ratingOptions}
                ariaLabel="Filter by rating"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">Sort by:</span>
              <FilterSelect
                value={selectedSort}
                onChange={(event) => {
                  setSelectedSort(event.target.value as SortOption)
                  setCurrentPage(1)
                }}
                options={sortOptions}
                ariaLabel="Sort suppliers"
              />
            </div>
          </div>
        </PageSectionContainer>
      </section>

      <PageSectionContainer className="py-12 lg:py-14">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-text-primary md:text-4xl">Browse Vendors</h2>
          <p className="mt-3 text-base text-text-secondary">
            {isLoading
              ? "Loading vendors…"
              : `Showing ${numericFormatter.format(totalCount)} verified vendors from a curated network.`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-text-muted">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : hasError ? (
          <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
            Unable to load vendors. Please try again later.
          </div>
        ) : supplierItems.length === 0 ? (
          <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
            No vendors match these filters. Clear one or more filters to see available vendors.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {supplierItems.map((supplier) => (
              <SupplierDirectoryCard
                key={supplier.id}
                supplier={{ ...supplier, isFavorite: favoriteIds.has(supplier.id as string) }}
                onToggleFavorite={() => handleToggleFavorite(supplier.id as string)}
              />
            ))}
          </div>
        )}
      </PageSectionContainer>

      {!isLoading && !hasError && totalPages > 1 && (
        <PageSectionContainer className="pb-14">
          <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border-soft bg-surface-elevated px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Showing <span className="font-semibold text-text-primary">{currentStart}</span>–
              <span className="font-semibold text-text-primary">{currentEnd}</span> of{" "}
              <span className="font-semibold text-text-primary">{totalCount}</span> suppliers
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-text-secondary transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-10 min-w-10 rounded-full border px-3 text-sm font-semibold transition-colors",
                    page === currentPage
                      ? "border-brand bg-brand text-white"
                      : "border-border-soft bg-surface text-text-secondary hover:text-brand",
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-text-secondary transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </PageSectionContainer>
      )}

      <PageSectionContainer className="pb-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold text-text-primary md:text-4xl">Browse by Category</h2>
          <p className="mt-3 text-text-secondary">
            Find vendors specializing in specific dental products and services.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {supplierCategories.map((category) => {
            const Icon = category.icon
            return (
              <div
                key={category.id}
                className="spotlight-border rounded-[1.25rem] border border-border-soft bg-surface-elevated p-5 text-center shadow-soft"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-soft bg-surface">
                  <Icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{category.label}</h3>
                <p className="mt-1 text-xs text-text-secondary">{category.supplierCount} suppliers</p>
              </div>
            )
          })}
        </div>
      </PageSectionContainer>

      <section className="bg-surface py-16">
        <PageSectionContainer>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold text-text-primary md:text-4xl">Why Choose Our Vendors</h2>
            <p className="mt-3 text-text-secondary">
              Every vendor is vetted for quality, reliability, and procurement performance.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {supplierTrustItems.map((item) => {
              const Icon = item.icon
              return (
                <article
                  key={item.id}
                  className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 shadow-soft"
                >
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                    <Icon className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">{item.description}</p>
                </article>
              )
            })}
          </div>
        </PageSectionContainer>
      </section>

      <PageSectionContainer className="py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold text-text-primary md:text-4xl">What Dental Professionals Say</h2>
          <p className="mt-3 text-text-secondary">Trusted by clinics and procurement teams across the United States.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {supplierTestimonials.map((testimonial) => (
            <article key={testimonial.id} className="rounded-4xl border border-border-soft bg-surface p-7 shadow-soft">
              <div className="mb-4 flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={`${testimonial.id}-star-${i + 1}`} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-7 text-text-secondary">"{testimonial.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white",
                    testimonial.avatarGradient,
                  )}
                >
                  {testimonial.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{testimonial.name}</p>
                  <p className="text-sm text-text-secondary">
                    {testimonial.clinic}, {testimonial.location}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </PageSectionContainer>

      <section className="pb-20">
        <PageSectionContainer>
          <div className="rounded-4xl bg-brand-surface px-6 py-14 text-center text-inverse-foreground shadow-panel sm:px-12">
            <h2 className="text-3xl font-semibold md:text-5xl text-inverse-foreground">
              Ready to Find Your Perfect Vendor?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-inverse-muted">
              Join thousands of dental professionals who rely on a verified vendor network to keep operations
              consistent.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-full px-8 py-3 text-sm font-semibold bg-accent-strong text-neutral-100 transition-transform hover:-translate-y-0.5"
              >
                Create Free Account
              </Link>
              <Link
                href="/help-center"
                className="rounded-full border border-white/80 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Contact Sales
              </Link>
            </div>
            <p className="mt-6 text-sm text-inverse-muted">No credit card required • Instant access • Cancel anytime</p>
          </div>
        </PageSectionContainer>
      </section>
    </>
  )
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 backdrop-blur-sm">
      <p className="text-3xl font-semibold text-inverse-foreground">{value}</p>
      <p className="mt-1 text-sm text-inverse-muted">{label}</p>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: React.ChangeEventHandler<HTMLSelectElement>
  options: ReadonlyArray<string>
  ariaLabel: string
}) {
  return (
    <div className="relative">
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={onChange}
        className="appearance-none rounded-full border border-border-soft bg-surface-elevated py-2.5 pr-10 pl-4 text-sm font-medium text-text-secondary outline-none transition-colors focus:border-brand focus:text-text-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </div>
  )
}
