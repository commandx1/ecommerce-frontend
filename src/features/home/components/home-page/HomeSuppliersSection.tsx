import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SupplierCard from "@/features/home/components/SupplierCard"
import type { HomeSupplierItem } from "@/features/home/types"

interface HomeSuppliersSectionProps {
  suppliers: ReadonlyArray<HomeSupplierItem>
}

export default function HomeSuppliersSection({ suppliers }: HomeSuppliersSectionProps) {
  return (
    <PageSectionContainer as="section" className="relative py-14 lg:py-18">
      <h2 className="max-w-[18ch] m-auto text-center font-display text-4xl leading-[1.03] text-text-primary md:text-5xl">
        Compare trusted suppliers before you buy.
      </h2>
      <p className="mt-4 m-auto text-center max-w-[62ch] text-base leading-relaxed text-text-secondary">
        Ratings, verification, and support strengths are front-loaded so procurement teams can decide with speed and
        confidence.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} {...supplier} />
        ))}
      </div>
    </PageSectionContainer>
  )
}
