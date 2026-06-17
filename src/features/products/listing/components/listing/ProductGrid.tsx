import { getFullImageUrl } from "@/lib/api/products"
import type { APIProduct } from "../ProductListingClient"
import ProductCard, { type ProductCardData } from "./ProductCard"

interface ProductGridProps {
  products: APIProduct[]
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

const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {products.map((product) => (
        <ProductCard key={product.productId} data={adaptAPIProduct(product)} />
      ))}
    </div>
  )
}

export default ProductGrid
