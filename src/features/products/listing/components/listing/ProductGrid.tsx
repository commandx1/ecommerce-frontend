import type { APIProduct } from "../ProductListingClient"
import ProductCard from "./ProductCard"

interface ProductGridProps {
  products: APIProduct[]
  viewType: "grid" | "list"
}

const ProductGrid = ({ products, viewType }: ProductGridProps) => {
  return (
    <div
      className={viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8" : "space-y-6 mb-8"}
    >
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} viewType={viewType} />
      ))}
    </div>
  )
}

export default ProductGrid
