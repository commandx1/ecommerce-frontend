import { Box, Download, Heart, ShieldCheck, Truck } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

interface ProductListingHeaderProps {
  totalElements: number
}

const ProductListingHeader = ({ totalElements }: ProductListingHeaderProps) => {
  return (
    <section className="border-y border-border-soft/70 bg-surface py-10">
      <PageSectionContainer as="div">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="section-kicker mb-4">Precision sourcing</div>
            <h1 className="text-5xl font-semibold text-text-primary md:text-6xl">Dental Products</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-text-secondary">
              Compare trusted vendors, technical specifications, and shipping confidence across a catalog designed for
              dental procurement teams.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <div className="flex items-center text-sm text-text-secondary">
                <Box className="mr-2 h-4 w-4 text-brand" />
                <span>{totalElements} products available</span>
              </div>
              <div className="flex items-center text-sm text-text-secondary">
                <Truck className="mr-2 h-4 w-4 text-brand" />
                <span>Fast shipping available</span>
              </div>
              <div className="flex items-center text-sm text-text-secondary">
                <ShieldCheck className="mr-2 h-4 w-4 text-brand" />
                <span>FDA certified products</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="flex items-center rounded-full bg-brand px-6 py-3 font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Catalog
            </button>
            <button
              type="button"
              className="flex items-center rounded-full border border-border-strong bg-surface-elevated px-6 py-3 font-semibold text-text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:text-brand"
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
