import { Box, Download, Heart, ShieldCheck, Truck } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

interface ProductListingHeaderProps {
  totalElements: number
}

const ProductListingHeader = ({ totalElements }: ProductListingHeaderProps) => {
  return (
    <section className="border-y border-border-soft/70 bg-surface py-8 sm:py-10">
      <PageSectionContainer as="div">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="section-kicker mb-3 sm:mb-4">Precision sourcing</div>
            <h1 className="text-3xl font-semibold text-text-primary sm:text-5xl md:text-6xl">Dental Products</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:mt-4 sm:text-lg sm:leading-8">
              Compare trusted vendors, technical specifications, and shipping confidence across a catalog designed for
              dental procurement teams.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:mt-6 sm:gap-5 lg:justify-start">
              <div className="flex items-center text-xs text-text-secondary sm:text-sm">
                <Box className="mr-2 h-4 w-4 text-brand" />
                <span>{totalElements} products available</span>
              </div>
              <div className="flex items-center text-xs text-text-secondary sm:text-sm">
                <Truck className="mr-2 h-4 w-4 text-brand" />
                <span>Fast shipping available</span>
              </div>
              <div className="flex items-center text-xs text-text-secondary sm:text-sm">
                <ShieldCheck className="mr-2 h-4 w-4 text-brand" />
                <span>FDA certified products</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <button
              type="button"
              className="flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong sm:px-6 sm:py-3 sm:text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Catalog
            </button>
            <button
              type="button"
              className="flex items-center rounded-full border border-border-strong bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:text-brand sm:px-6 sm:py-3 sm:text-base"
            >
              <Heart className="mr-2 h-4 w-4" />
              Save Category
            </button>
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductListingHeader
