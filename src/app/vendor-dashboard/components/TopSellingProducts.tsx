import Image from "next/image"
import Link from "next/link"
import vendorTopProductsData from "@/data/vendor-top-products.json"

const TopSellingProducts = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-steel-blue">Top Selling Products</h2>
        <Link href="/products" className="text-steel-blue hover:text-opacity-80 text-sm">
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {vendorTopProductsData.products.map((product) => (
          <div key={product.id} className="flex items-center p-4 bg-light-mint-gray rounded-xl">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
              <Image src={product.image} alt={product.name} width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-steel-blue">{product.name}</div>
              <div className="text-sm text-gray-600">SKU: {product.sku}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-steel-blue">{product.sold} sold</div>
              <div className="text-sm text-green-600">{product.change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopSellingProducts
