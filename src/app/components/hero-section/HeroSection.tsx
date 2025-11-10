import { Search, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"

const HeroSection = () => {
  return (
    <section id="hero-section" className="bg-linear-to-br from-steel-blue to-blue-800 py-8 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Professional Dental
              <span className="text-pale-lime">Supplies</span>
              <br />
              &amp; Equipment
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Connect with verified suppliers, access competitive pricing, and streamline your dental practice
              procurement with our comprehensive B2B marketplace.
            </p>
            <div className="bg-white rounded-xl p-6 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search products, brands, or suppliers..."
                    className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
                  />
                </div>
                <button
                  type="button"
                  className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold flex items-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-gray-600">Popular searches:</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  Dental Implants
                </button>
                <span className="text-gray-300">•</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  Composite Resins
                </button>
                <span className="text-gray-300">•</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  X-Ray Equipment
                </button>
                <span className="text-gray-300">•</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  Orthodontic Supplies
                </button>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="h-96 overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/heroSectionChair.png"
                alt="modern dental office with advanced equipment, professional dentist working, clean white environment, high-tech dental chair and tools"
                className="w-full h-full object-cover"
                width={500}
                height={500}
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-pale-lime rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-steel-blue" />
                </div>
                <div>
                  <div className="font-semibold text-steel-blue">Verified Suppliers</div>
                  <div className="text-sm text-gray-600">Licensed &amp; Certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
