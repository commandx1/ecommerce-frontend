"use client"

import { X } from "lucide-react"
import type { VendorOption } from "@/lib/api/public-products"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"

interface ActiveFiltersProps {
  vendors: VendorOption[]
}

const ActiveFilters = ({ vendors }: ActiveFiltersProps) => {
  const {
    navigate,
    currentBrands,
    currentManufacturers,
    currentCategories,
    currentVendors,
    currentMinPrice,
    currentMaxPrice,
    currentMinRating,
    currentInStock,
    currentAttributes,
  } = useProductFiltersNavigation()

  const priceLabel =
    currentMinPrice != null || currentMaxPrice != null
      ? `$${currentMinPrice ?? 0} – ${currentMaxPrice != null ? `$${currentMaxPrice}` : "Any"}`
      : null

  const attributeGroups = currentAttributes.reduce<Record<string, string[]>>((acc, attr) => {
    const [name, value] = attr.split(":", 2)
    if (!acc[name]) acc[name] = []
    acc[name].push(value)
    return acc
  }, {})

  const groups = [
    {
      label: "Vendor",
      chips: currentVendors.map((id) => ({
        key: `vendor-${id}`,
        text: vendors.find((v) => v.id === id)?.name ?? id,
        onRemove: () => navigate({ vendors: currentVendors.filter((v) => v !== id) }),
      })),
    },
    {
      label: "Category",
      chips: currentCategories.map((cat) => ({
        key: `cat-${cat}`,
        text: cat,
        onRemove: () => navigate({ categories: currentCategories.filter((c) => c !== cat) }),
      })),
    },
    {
      label: "Brand",
      chips: currentBrands.map((brand) => ({
        key: `brand-${brand}`,
        text: brand,
        onRemove: () => navigate({ brands: currentBrands.filter((b) => b !== brand) }),
      })),
    },
    {
      label: "Manufacturer",
      chips: currentManufacturers.map((mfr) => ({
        key: `mfr-${mfr}`,
        text: mfr,
        onRemove: () => navigate({ manufacturers: currentManufacturers.filter((m) => m !== mfr) }),
      })),
    },
    {
      label: "Price Range",
      chips: priceLabel
        ? [{ key: "price", text: priceLabel, onRemove: () => navigate({ minPrice: null, maxPrice: null }) }]
        : [],
    },
    {
      label: "Customer Rating",
      chips:
        currentMinRating != null
          ? [{ key: "rating", text: `${currentMinRating}+ Stars`, onRemove: () => navigate({ minRating: null }) }]
          : [],
    },
    {
      label: "Availability",
      chips: !currentInStock
        ? [{ key: "stock", text: "Out of stock included", onRemove: () => navigate({ inStock: true }) }]
        : [],
    },
    ...Object.entries(attributeGroups).map(([attrName, values]) => ({
      label: attrName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      chips: values.map((v) => ({
        key: `attr-${attrName}-${v}`,
        text: v,
        onRemove: () =>
          navigate({ attributes: currentAttributes.filter((a) => a !== `${attrName}:${v}`) }),
      })),
    })),
  ].filter((g) => g.chips.length > 0)

  if (groups.length === 0) return null

  const clearAll = () =>
    navigate({
      brands: [],
      manufacturers: [],
      categories: [],
      vendors: [],
      minPrice: null,
      maxPrice: null,
      minRating: null,
      inStock: true,
      attributes: [],
    })

  return (
    <div className="p-6 border-b border-border-soft">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Active Filters</h3>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-text-muted mb-1.5">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20"
                >
                  {chip.text}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="ml-1 rounded-full hover:bg-brand/20 p-0.5"
                    aria-label={`Remove ${chip.text} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}

export default ActiveFilters
