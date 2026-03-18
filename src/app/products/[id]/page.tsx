import { getFullImageUrl } from "@/lib/api/products"
import { fetchProductDetailPageData } from "@/lib/api/product-detail"
import Breadcrumb from "./components/Breadcrumb"
import ProductDetailsTabs from "./components/ProductDetailsTabs"
import ProductError from "./components/ProductError"
import ProductQuestions from "./components/ProductQuestions"
import ProductReviews from "./components/ProductReviews"
import ProductWithSuppliers from "./components/ProductWithSuppliers"
import PurchaseOptions from "./components/PurchaseOptions"
import RecentlyViewed from "./components/RecentlyViewed"
import RelatedProducts from "./components/RelatedProducts"
import TechnicalSpecs from "./components/TechnicalSpecs"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params

  try {
    const { productData, reviews, questions } = await fetchProductDetailPageData(id)
    const product = productData.product
    const userProducts = productData.userProducts || []

    // Build photo paths
    const photoPaths = product.photoPhats || []
    if (product.coverPhotoPath) {
      photoPaths.unshift(product.coverPhotoPath)
    }
    const fallbackImage = "/dentypro-product-placeholder.png"
    const mainImagePath = product.coverPhotoPath || photoPaths[0]
    const mainImage = mainImagePath ? getFullImageUrl(mainImagePath) : fallbackImage

    // Build features
    const features: string[] = []
    if (product.brand) features.push(`Brand: ${product.brand}`)
    if (product.packaging) features.push(product.packaging)
    if (product.type) features.push(product.type)
    if (product.size) features.push(`Size: ${product.size}`)
    if (features.length === 0) {
      features.push("Professional Grade", "Quality Assured", "Fast Delivery", "Verified Supplier")
    }

    // Build technical specs
    const technicalSpecs = []
    if (product.brand) technicalSpecs.push({ label: "Brand", value: product.brand })
    if (product.manufacturerCode) technicalSpecs.push({ label: "Manufacturer Code", value: product.manufacturerCode })
    if (product.packaging) technicalSpecs.push({ label: "Packaging", value: product.packaging })
    if (product.primaryMarket) technicalSpecs.push({ label: "Primary Market", value: product.primaryMarket })
    if (product.size) technicalSpecs.push({ label: "Size", value: product.size })
    if (product.type) technicalSpecs.push({ label: "Type", value: product.type })
    if (product.scent) technicalSpecs.push({ label: "Scent", value: product.scent })
    technicalSpecs.push({ label: "Barcode", value: String(product.barcode || "-") })
    technicalSpecs.push({ label: "Barcode Format", value: product.barcodeFormats || "-" })

    // Build description
    const description = {
      paragraphs: [product.aboutProduct, product.description].filter((p) => p),
      benefits: features,
      included: [],
      installationNote: "",
    }

    // Get best price vendor user product ID from API response
    const bestPriceVendorUserProductId =
      product.bestPriceVendorUserProductId ||
      (userProducts.length > 0
        ? userProducts.reduce((best: any, current: any) => (current.price < best.price ? current : best))?.id
        : null)

    return (
      <>
        <Breadcrumb
          product={{
            title: product.name,
            category: product.primaryMarket || "Products",
          }}
        />
        <ProductWithSuppliers
          product={{
            price: product.price || 0,
            title: product.name,
            bestPriceVendor: product.bestPriceVendor || "",
            description: product.aboutProduct || "",
            category: product.primaryMarket || "Products",
            rating: product.overallStar || 0,
            reviewCount: product.reviewCount || 0,
            sku: product.id.substring(0, 8).toUpperCase(),
            features,
            mainImage,
            thumbnailImages: photoPaths.map(getFullImageUrl),
            badge: "Available",
          }}
          suppliers={
            userProducts.length > 0
              ? userProducts
                  .sort((a: any, b: any) => a.price - b.price)
                  .map((up: any, index: number) => ({
                    id: index + 1,
                    userProductId: up.id,
                    name: up.vendor || "Vendor",
                    logo: up.vendorLogo,
                    alt: `${up.vendor || "Vendor"} logo`,
                    badge: up.id === bestPriceVendorUserProductId ? "Best Seller" : "Verified",
                    price: `$${up.price.toFixed(2)}`,
                    originalPrice: up.oldPrice && up.oldPrice !== up.price ? `$${up.oldPrice.toFixed(2)}` : null,
                    stock: up.stock > 0 ? "In Stock" : "Out of Stock",
                    stockColor: up.stock > 0 ? "green" : "gray",
                    stockCount: up.stock || 0,
                    shipping: "Free",
                    shippingNote: "Standard shipping",
                    distance: up.vendorDistance,
                    distanceTime: up.vendorDistanceTime,
                    rating: 4.5,
                    starCount: 5,
                  }))
              : []
          }
          bestPriceVendorUserProductId={bestPriceVendorUserProductId}
        />
        <TechnicalSpecs
          technicalSpecs={technicalSpecs}
          certifications={[
            {
              id: 1,
              icon: "shield-check",
              iconColor: "green",
              title: "FDA Approved",
              description: "FDA cleared for orthodontic applications.",
              badge: "Registration: K192345",
              badgeColor: "green",
            },
            {
              id: 2,
              icon: "certificate",
              iconColor: "blue",
              title: "CE Marking",
              description: "CE marked for European market.",
              badge: "CE Certified",
              badgeColor: "blue",
            },

            {
              id: 3,
              icon: "lock",
              iconColor: "purple",
              title: "HIPAA Compliant",
              description: "HIPAA compliant for dental practices.",
              badge: "HIPAA Compliant",
              badgeColor: "purple",
            },
          ]}
        />
        <PurchaseOptions
          bulkPricing={[
            {
              id: 1,
              range: "1 Unit",
              price: formatCurrency(product.price),
              note: "Each",
              selected: false,
            },
            {
              id: 2,
              range: "2-4 Units",
              price: formatCurrency(product.price * 0.9),
              note: "Save $100 each",
              selected: true,
            },
            {
              id: 3,
              range: "5+ Units",
              price: formatCurrency(product.price * 0.8),
              note: "Save $200 each",
              selected: false,
            },
          ]}
          warrantyOptions={[
            {
              id: 1,
              value: "standard",
              title: "Standard Warranty (2 Years)",
              description: "Included - No additional cost",
              price: "Free",
              selected: true,
            },
            {
              id: 2,
              value: "extended",
              title: "Extended Warranty (4 Years)",
              description: "Includes priority support and replacement",
              price: "+$299",
              selected: false,
            },
          ]}
          orderSummary={{
            product: product.name || "",
            productPrice: String(product.price || 0),
            warranty: "0",
            shipping: "0",
            subtotal: String(product.price || 0),
            tax: "0",
            total: String(product.price || 0),
          }}
        />
        <ProductDetailsTabs
          description={{
            ...description,
            installationNote: {
              title: "Installation Note",
              text: description.installationNote || "",
            },
          }}
        />
        <ProductReviews productId={id} initialReviews={reviews} />
        <ProductQuestions
          productId={id}
          initialQuestions={questions}
          userProducts={userProducts.map((up: any) => ({ id: up.id, vendor: up.vendor }))}
        />
        <RelatedProducts currentProductId={Number.parseInt(id.substring(0, 8), 16) || 1} />
        <RecentlyViewed />
      </>
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    return <ProductError message={errorMessage} />
  }
}
