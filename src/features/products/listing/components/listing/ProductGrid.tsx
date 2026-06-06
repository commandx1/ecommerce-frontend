import { getFullImageUrl } from "@/lib/api/products"
import type { APIProduct } from "../ProductListingClient"
import ProductCard, { type ProductCardData } from "./ProductCard"

interface ProductGridProps {
  products: APIProduct[]
  viewType: "grid" | "list"
}

const adaptAPIProduct = (p: APIProduct): ProductCardData => ({
  id: p.productId,
  name: p.productName,
  brand: p.brand ?? undefined,
  imageSrc: p.coverPhotoPath ? getFullImageUrl(p.coverPhotoPath) : "/dentypro-product-placeholder.png",
  price: p.price,
  oldPrice: p.oldPrice > p.price ? p.oldPrice : undefined,
  overallStar: p.overallStar,
  reviewCount: p.reviewCount,
  stock: p.stock,
  href: `/products/${p.productId}`,
})

const ProductGrid = ({ products, viewType }: ProductGridProps) => {
  return (
    <div
      className={viewType === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8" : "space-y-6 mb-8"}
    >
      {products.map((product) => (
        <ProductCard key={product.productId} data={adaptAPIProduct(product)} viewType={viewType} />
      ))}
    </div>
  )
}

export default ProductGrid
