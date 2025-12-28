import {
  Armchair,
  ArrowRight,
  Box,
  ChevronDown,
  FlaskConical,
  Headset,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  Microscope,
  Phone,
  Scan,
  Store,
  Syringe,
  Tag,
  UserCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="bg-light-mint-gray min-h-screen font-inter">
      {/* 404 Main Section */}
      <section className="min-h-[80vh] flex items-center justify-center py-16">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="mb-8">
                <div className="inline-block bg-coral-orange/10 rounded-2xl px-6 py-3 mb-6">
                  <span className="text-coral-orange font-bold text-lg">Error 404</span>
                </div>
                <h1 className="text-6xl lg:text-7xl font-bold text-steel-blue mb-6 leading-tight">
                  Oops! Page Not Found
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  The page you're looking for doesn't exist or has been moved. Don't worry, we'll help you get back on
                  track to finding the dental supplies you need.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/"
                  className="bg-steel-blue text-white px-8 py-4 rounded-lg hover:bg-opacity-90 font-semibold flex items-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
                <Link
                  href="/contact"
                  className="bg-white border-2 border-steel-blue text-steel-blue px-8 py-4 rounded-lg hover:bg-steel-blue hover:text-white transition-colors font-semibold flex items-center"
                >
                  <Headset className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="relative">
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-pale-lime rounded-full opacity-20" />
                <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-coral-orange rounded-full opacity-20" />
                <div className="relative bg-white rounded-3xl shadow-2xl p-12 text-center">
                  <div className="w-64 h-64 mx-auto mb-8 flex items-center justify-center">
                    <div className="relative">
                      <div className="text-9xl font-bold text-steel-blue opacity-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse">
                        404
                      </div>{" "}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm italic">You seem to be lost</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Pages */}
      <section className="py-16 bg-white">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-steel-blue mb-4">Popular Pages</h2>
            <p className="text-lg text-gray-600">Here are some pages you might be looking for</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Box,
                title: "All Products",
                desc: "Browse our complete catalog of dental supplies",
                link: "/products",
                btnText: "View Products",
              },
              {
                icon: Store,
                title: "Suppliers",
                desc: "Find verified dental suppliers",
                link: "/suppliers",
                btnText: "Browse Suppliers",
              },
              {
                icon: Tag,
                title: "Top Deals",
                desc: "Explore current promotions and discounts",
                link: "/top-deals",
                btnText: "View Deals",
              },
              {
                icon: UserCircle,
                title: "My Account",
                desc: "Manage your orders and profile",
                link: "/buyer-dashboard",
                btnText: "Go to Account",
              },
            ].map((page) => (
              <Link
                key={page.title}
                href={page.link}
                className="bg-light-mint-gray rounded-2xl p-6 hover:shadow-lg transition-shadow group"
              >
                <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-white">
                  <page.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-steel-blue mb-2">{page.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{page.desc}</p>
                <div className="flex items-center text-steel-blue text-sm font-medium">
                  {page.btnText} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-light-mint-gray">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-steel-blue mb-4">Browse by Category</h2>
            <p className="text-lg text-gray-600">Find what you need in our organized product categories</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Syringe, title: "Instruments", link: "/products?category=instruments" },
              { icon: FlaskConical, title: "Materials", link: "/products?category=materials" },
              { icon: Scan, title: "Imaging", link: "/products?category=imaging" },
              { icon: Box, title: "Orthodontics", link: "/products?category=orthodontics" },
              { icon: Microscope, title: "Lab Equipment", link: "/products?category=lab" },
              { icon: Armchair, title: "Office", link: "/products?category=office" },
            ].map((cat) => (
              <Link
                key={cat.title}
                href={cat.link}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow group"
              >
                <div className="w-16 h-16 bg-steel-blue/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-steel-blue group-hover:scale-110 transition-all text-steel-blue group-hover:text-white">
                  <cat.icon className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-steel-blue">{cat.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-white">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-steel-blue to-blue-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="p-12 text-white">
                <h2 className="text-4xl font-bold mb-6">Need Help?</h2>
                <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                  Our support team is here to assist you 24/7. Whether you have questions about products, orders, or
                  your account, we're ready to help.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Phone, title: "Call Us", desc: "1-800-DENTAL-HUB", detail: "Mon-Fri: 8AM - 8PM EST" },
                    { icon: Mail, title: "Email Us", desc: "support@dentalhub.com", detail: "Response within 2 hours" },
                    {
                      icon: MessageSquare,
                      title: "Live Chat",
                      desc: "Chat with our support team",
                      detail: "Available 24/7",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start space-x-4 text-white">
                      <div className="w-12 h-12 bg-pale-lime rounded-lg flex items-center justify-center flex-shrink-0 text-steel-blue">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">{item.title}</div>
                        <div className="text-blue-100">{item.desc}</div>
                        <div className="text-sm text-blue-200">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="bg-pale-lime text-steel-blue px-8 py-4 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center"
                >
                  Contact Support
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
              <div className="h-full min-h-[400px] relative">
                <Image
                  fill
                  className="object-cover"
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/7a1bbf49e4-c4f1c6e77acce9c8c7e2.png"
                  alt="Customer Support"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-light-mint-gray">
        <div className="app-container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-steel-blue mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Quick answers to common questions</p>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "How do I track my order?",
                a: "You can track your order by logging into your account and visiting the Orders section, or use the tracking link sent to your email.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, wire transfers, and offer net payment terms for verified practices.",
              },
              {
                q: "How do I become a verified supplier?",
                a: "Visit our Supplier Registration page and complete the verification process with required licenses and certifications.",
              },
              {
                q: "What is your return policy?",
                a: "We offer 30-day returns on most products. Items must be unused and in original packaging.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-steel-blue mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-steel-blue ml-4" />
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="text-steel-blue font-semibold hover:underline flex items-center justify-center"
            >
              View All FAQs <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
