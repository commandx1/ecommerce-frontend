import { CheckCircle, Globe, Info, MapPin, Truck, Zap } from "lucide-react"

export default function ShippingMethodsComparison() {
  return (
    <section id="shipping-methods-comparison" className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">Shipping Methods</h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the delivery solution that fits your operational requirements
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-steel-blue text-white">
                <tr>
                  <th className="text-left p-4 sm:p-6 font-semibold text-sm sm:text-base">Feature</th>
                  <th className="text-center p-4 sm:p-6 font-semibold text-sm sm:text-base">
                    <div className="flex flex-col items-center">
                      <Zap className="text-pale-lime w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                      <span>Uber Direct</span>
                    </div>
                  </th>
                  <th className="text-center p-4 sm:p-6 font-semibold text-sm sm:text-base">
                    <div className="flex flex-col items-center">
                      <Truck className="text-pale-lime w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                      <span>Shippo</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 font-medium text-gray-700 text-sm sm:text-base">Best For</td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-pale-lime/20 text-steel-blue font-medium text-xs sm:text-sm">
                      <MapPin className="w-3 h-3 mr-2" />
                      Local same-day
                    </span>
                  </td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-steel-blue font-medium text-xs sm:text-sm">
                      <Globe className="w-3 h-3 mr-2" />
                      National & international
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 bg-light-mint-gray/30">
                  <td className="p-4 sm:p-6 font-medium text-gray-700 text-sm sm:text-base">Delivery Speed</td>
                  <td className="p-4 sm:p-6 text-center">
                    <div className="text-steel-blue font-semibold text-sm sm:text-base">Same day</div>
                    <div className="text-gray-500 text-xs sm:text-sm mt-1">2–4 hours</div>
                  </td>
                  <td className="p-4 sm:p-6 text-center">
                    <div className="text-steel-blue font-semibold text-sm sm:text-base">1–5 business days</div>
                    <div className="text-gray-500 text-xs sm:text-sm mt-1">Carrier dependent</div>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 font-medium text-gray-700 text-sm sm:text-base">Tracking</td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <span className="inline-flex items-center justify-center">
                      <CheckCircle className="text-green-500 w-5 h-5 mr-2 shrink-0" />
                      Real-time courier tracking
                    </span>
                  </td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <span className="inline-flex items-center justify-center">
                      <CheckCircle className="text-green-500 w-5 h-5 mr-2 shrink-0" />
                      Carrier-based tracking
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 bg-light-mint-gray/30">
                  <td className="p-4 sm:p-6 font-medium text-gray-700 text-sm sm:text-base">Bulk Orders</td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <span className="text-gray-500">Limited</span>
                  </td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <span className="inline-flex items-center justify-center">
                      <CheckCircle className="text-green-500 w-5 h-5 mr-2 shrink-0" />
                      Fully supported
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-4 sm:p-6 font-medium text-gray-700 text-sm sm:text-base">Coverage</td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <div className="text-steel-blue font-medium">Selected cities</div>
                    <div className="text-gray-500 text-xs sm:text-sm mt-1">Major metro areas</div>
                  </td>
                  <td className="p-4 sm:p-6 text-center text-sm sm:text-base">
                    <div className="text-steel-blue font-medium">Domestic & international</div>
                    <div className="text-gray-500 text-xs sm:text-sm mt-1">Nationwide coverage</div>
                  </td>
                </tr>
                <tr className="bg-light-mint-gray/30">
                  <td className="p-4 sm:p-6 font-medium text-gray-700 text-sm sm:text-base">Ideal Use Case</td>
                  <td className="p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-600">
                    Urgent local deliveries, emergency supplies
                  </td>
                  <td className="p-4 sm:p-6 text-center text-xs sm:text-sm text-gray-600">
                    Standard orders, bulk shipments, cross-country
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8 sm:mt-12">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pale-lime rounded-xl flex items-center justify-center mr-4">
                <Zap className="text-steel-blue w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Uber Direct</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
              For time-sensitive local deliveries within select metropolitan areas. Ideal for urgent supply needs and
              emergency orders.
            </p>
            <div className="space-y-3">
              {[
                "Same-day delivery within 2–4 hours",
                "Live courier tracking with ETA updates",
                "Direct-to-practice delivery",
              ].map((text) => (
                <div key={text} className="flex items-start">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-3 mt-1 shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">{text}</span>
                </div>
              ))}
              <div className="flex items-start">
                <Info className="text-gray-400 w-5 h-5 mr-3 mt-1 shrink-0" />
                <span className="text-sm sm:text-base text-gray-600">Limited to orders under 50 lbs</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-steel-blue rounded-xl flex items-center justify-center mr-4">
                <Truck className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Shippo</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
              Multi-carrier shipping platform supporting nationwide and international deliveries with comprehensive
              tracking and insurance options.
            </p>
            <div className="space-y-3">
              {[
                "Access to UPS, FedEx, USPS, DHL, and more",
                "Bulk shipment support with pallet options",
                "International customs documentation",
                "Automatic rate comparison at checkout",
              ].map((text) => (
                <div key={text} className="flex items-start">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-3 mt-1 shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
