"use client"

import { ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SupplierDirectoryCard from "@/features/suppliers/components/SupplierDirectoryCard"
import {
  type SupplierDirectoryItem,
  supplierCategories,
  suppliersDirectoryData,
  supplierTestimonials,
  supplierTrustItems,
} from "@/features/suppliers/suppliersPageData"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 6

const categoryOptions = ["All Categories", ...supplierCategories.map((category) => category.label)] as const
const locationOptions = ["All Locations", "California", "Texas", "New York", "Florida"] as const
const ratingOptions = ["Rating: All", "5 Stars", "4+ Stars", "3+ Stars"] as const
const sortOptions = ["Highest Rated", "Most Reviews", "A-Z"] as const

type SortOption = (typeof sortOptions)[number]

const numericFormatter = new Intl.NumberFormat("en-US")

const getSortValue = (supplier: SupplierDirectoryItem, sortBy: SortOption) => {
  if (sortBy === "Most Reviews") return supplier.reviewCount
  if (sortBy === "A-Z") return supplier.name
  return supplier.rating
}

export default function SuppliersDirectorySection() {
  const [selectedCategory, setSelectedCategory] = useState<(typeof categoryOptions)[number]>("All Categories")
  const [selectedLocation, setSelectedLocation] = useState<(typeof locationOptions)[number]>("All Locations")
  const [selectedRating, setSelectedRating] = useState<(typeof ratingOptions)[number]>("Rating: All")
  const [selectedSort, setSelectedSort] = useState<SortOption>("Highest Rated")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredSuppliers = useMemo(() => {
    const suppliers = suppliersDirectoryData.filter((supplier) => {
      const categoryMatch = selectedCategory === "All Categories" || supplier.category === selectedCategory
      const locationMatch = selectedLocation === "All Locations" || supplier.location === selectedLocation
      const ratingMatch =
        selectedRating === "Rating: All" ||
        (selectedRating === "5 Stars" && supplier.rating >= 5) ||
        (selectedRating === "4+ Stars" && supplier.rating >= 4) ||
        (selectedRating === "3+ Stars" && supplier.rating >= 3)

      return categoryMatch && locationMatch && ratingMatch
    })

    return [...suppliers].sort((left, right) => {
      if (selectedSort === "A-Z") {
        const leftValue = getSortValue(left, selectedSort) as string
        const rightValue = getSortValue(right, selectedSort) as string
        return leftValue.localeCompare(rightValue)
      }

      const leftValue = getSortValue(left, selectedSort) as number
      const rightValue = getSortValue(right, selectedSort) as number
      return rightValue - leftValue
    })
  }, [selectedCategory, selectedLocation, selectedRating, selectedSort])

  const pageCount = Math.max(1, Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE))

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, selectedLocation, selectedRating, selectedSort])

  const visibleSuppliers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredSuppliers.slice(start, start + ITEMS_PER_PAGE)
  }, [currentPage, filteredSuppliers])

  const currentStart = filteredSuppliers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1
  const currentEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredSuppliers.length)

  return (
    <>
      <section className="relative overflow-hidden bg-brand-surface py-18 text-inverse-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 mesh-panel opacity-50" />
        <PageSectionContainer>
          <div className="relative max-w-4xl">
            <h1 className="text-4xl font-semibold leading-[1.02] text-inverse-foreground md:text-6xl">
              Trusted Dental Suppliers
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-inverse-muted md:text-xl">
              Connect with verified suppliers offering quality dental products and equipment across the United States.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroMetric value="450+" label="Verified Suppliers" />
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
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value as (typeof categoryOptions)[number])}
                options={categoryOptions}
                ariaLabel="Filter by category"
              />
              <FilterSelect
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value as (typeof locationOptions)[number])}
                options={locationOptions}
                ariaLabel="Filter by location"
              />
              <FilterSelect
                value={selectedRating}
                onChange={(event) => setSelectedRating(event.target.value as (typeof ratingOptions)[number])}
                options={ratingOptions}
                ariaLabel="Filter by rating"
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand"
              >
                <SlidersHorizontal className="h-4 w-4" />
                More Filters
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-muted">Sort by:</span>
              <FilterSelect
                value={selectedSort}
                onChange={(event) => setSelectedSort(event.target.value as SortOption)}
                options={sortOptions}
                ariaLabel="Sort suppliers"
              />
            </div>
          </div>
        </PageSectionContainer>
      </section>

      <PageSectionContainer className="py-12 lg:py-14">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-text-primary md:text-4xl">Browse Suppliers</h2>
          <p className="mt-3 text-base text-text-secondary">
            Showing {numericFormatter.format(filteredSuppliers.length)} verified suppliers from a curated network.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleSuppliers.map((supplier) => (
            <SupplierDirectoryCard key={supplier.id} supplier={supplier} />
          ))}
        </div>

        {visibleSuppliers.length === 0 ? (
          <div className="mt-8 rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
            No supplier matches these filters. Clear one or more filters to see available suppliers.
          </div>
        ) : null}
      </PageSectionContainer>

      <PageSectionContainer className="pb-14">
        <div className="flex flex-col gap-4 rounded-[1.25rem] border border-border-soft bg-surface-elevated px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            Showing <span className="font-semibold text-text-primary">{currentStart}</span>-
            <span className="font-semibold text-text-primary">{currentEnd}</span> of{" "}
            <span className="font-semibold text-text-primary">{filteredSuppliers.length}</span> suppliers
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-text-secondary transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
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
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-text-secondary transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </PageSectionContainer>

      <PageSectionContainer className="pb-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold text-text-primary md:text-4xl">Browse by Category</h2>
          <p className="mt-3 text-text-secondary">
            Find suppliers specializing in specific dental products and services.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {supplierCategories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.label
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.label)}
                className={cn(
                  "spotlight-border rounded-[1.25rem] border bg-surface-elevated p-5 text-center transition-all hover:-translate-y-0.5",
                  isSelected ? "border-brand shadow-panel" : "border-border-soft shadow-soft",
                )}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-soft bg-surface">
                  <Icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary">{category.label}</h3>
                <p className="mt-1 text-xs text-text-secondary">{category.supplierCount} suppliers</p>
              </button>
            )
          })}
        </div>
      </PageSectionContainer>

      <section className="bg-surface py-16">
        <PageSectionContainer>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold text-text-primary md:text-4xl">Why Choose Our Suppliers</h2>
            <p className="mt-3 text-text-secondary">
              Every supplier is vetted for quality, reliability, and procurement performance.
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
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={`${testimonial.id}-star-${index + 1}`} className="h-4 w-4 fill-current" />
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
              Ready to Find Your Perfect Supplier?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-inverse-muted">
              Join thousands of dental professionals who rely on a verified supplier network to keep operations
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
