import type { APIProduct } from "../ProductListingClient"
import { adaptProductCardData } from "./adaptProductCardData"
import ProductCard from "./ProductCard"

interface ProductGridProps {
  products: APIProduct[]
}

const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <div className="@container mb-8">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @3xl:grid-cols-3 @min-[69rem]:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.productId} data={adaptProductCardData(product)} />
        ))}
      </div>
    </div>
  )
}

export default ProductGrid
