import Image from "next/image"
import Link from "next/link"
import vendorTopProductsData from "@/data/vendor-top-products.json"
import DashboardPanel from "./shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const TopSellingProducts = () => {
  return (
    <DashboardPanel
      title="Top Selling Products"
      action={
        <Link href="/products" className="text-sm text-brand transition-colors hover:text-brand-strong">
          View All
        </Link>
      }
    >
      <div className="space-y-4">
        {vendorTopProductsData.products.map((product) => (
          <div
            key={product.id}
            className="flex items-center rounded-xl border border-border-soft bg-surface-muted/70 p-4"
          >
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border-soft bg-surface-elevated">
              <Image src={product.image} alt={product.name} width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-text-primary">{product.name}</div>
              <div className="text-sm text-text-secondary">SKU: {product.sku}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-text-primary">{product.sold} sold</div>
              <div className={`inline-flex rounded-full border px-2 py-0.5 text-sm ${STATUS_TONE_CLASS_MAP.success}`}>
                {product.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  )
}

export default TopSellingProducts
