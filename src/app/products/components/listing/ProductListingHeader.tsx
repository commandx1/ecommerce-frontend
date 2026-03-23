import { Box, Download, Heart, ShieldCheck, Truck } from "lucide-react"

interface ProductListingHeaderProps {
  totalElements: number
}

const ProductListingHeader = ({ totalElements }: ProductListingHeaderProps) => {
  return (
    <section className="bg-white py-8">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-steel-blue mb-2">Dental Products</h1>
            <p className="text-lg text-gray-600">Quality dental supplies and equipment from verified vendors</p>
            <div className="flex flex-wrap items-center mt-4 gap-6">
              <div className="flex items-center text-sm text-gray-600">
                <Box className="w-4 h-4 mr-2 text-steel-blue" />
                <span>{totalElements} products available</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Truck className="w-4 h-4 mr-2 text-steel-blue" />
                <span>Fast shipping available</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ShieldCheck className="w-4 h-4 mr-2 text-steel-blue" />
                <span>FDA certified products</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-semibold flex items-center transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Catalog
            </button>
            <button
              type="button"
              className="border border-steel-blue text-steel-blue px-6 py-3 rounded-lg hover:bg-steel-blue hover:text-white transition-all font-semibold flex items-center"
            >
              <Heart className="w-4 h-4 mr-2" />
              Save Category
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductListingHeader
