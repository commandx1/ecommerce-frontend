import { Facebook, Hospital, Instagram, Linkedin, Twitter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const Footer = () => {
  return (
    <footer id="footer" className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center">
                <Hospital />
              </div>
              <span className="ml-3 text-2xl font-bold text-white">DentyPro</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              The leading B2B marketplace for dental professionals in the United States. Connect with verified
              suppliers, access competitive pricing, and streamline your practice procurement.
            </p>
            <div className="flex space-x-4">
              <Button
                size="icon"
                className="from-gray-700 via-gray-700/60 to-gray-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-linear-to-r bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center]"
              >
                <Facebook />
              </Button>
              <Button
                size="icon"
                className="from-gray-700 via-gray-700/60 to-gray-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-linear-to-r bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center]"
              >
                <Twitter />
              </Button>
              <Button
                size="icon"
                className="from-gray-700 via-gray-700/60 to-gray-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-linear-to-r bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center]"
              >
                <Linkedin />
              </Button>
              <Button
                size="icon"
                className="from-gray-700 via-gray-700/60 to-gray-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 bg-transparent bg-linear-to-r bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center]"
              >
                <Instagram />
              </Button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dental-instruments" className="text-gray-300 hover:text-white transition-colors">
                  Dental Instruments
                </Link>
              </li>
              <li>
                <Link href="/restorative-materials" className="text-gray-300 hover:text-white transition-colors">
                  Restorative Materials
                </Link>
              </li>
              <li>
                <Link href="/digital-imaging" className="text-gray-300 hover:text-white transition-colors">
                  Digital Imaging
                </Link>
              </li>
              <li>
                <Link href="/orthodontics" className="text-gray-300 hover:text-white transition-colors">
                  Orthodontics
                </Link>
              </li>
              <li>
                <Link href="/lab-equipment" className="text-gray-300 hover:text-white transition-colors">
                  Lab Equipment
                </Link>
              </li>
              <li>
                <Link href="/office-equipment" className="text-gray-300 hover:text-white transition-colors">
                  Office Equipment
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/supplier-network" className="text-gray-300 hover:text-white transition-colors">
                  Supplier Network
                </Link>
              </li>
              <li>
                <Link href="/lab-services" className="text-gray-300 hover:text-white transition-colors">
                  Lab Services
                </Link>
              </li>
              <li>
                <Link href="/equipment-installation" className="text-gray-300 hover:text-white transition-colors">
                  Equipment Installation
                </Link>
              </li>
              <li>
                <Link href="/training-programs" className="text-gray-300 hover:text-white transition-colors">
                  Training Programs
                </Link>
              </li>
              <li>
                <Link href="/technical-support" className="text-gray-300 hover:text-white transition-colors">
                  Technical Support
                </Link>
              </li>
              <li>
                <Link href="/financing-options" className="text-gray-300 hover:text-white transition-colors">
                  Financing Options
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help-center" className="text-gray-300 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/order-tracking" className="text-gray-300 hover:text-white transition-colors">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/returns-and-exchanges" className="text-gray-300 hover:text-white transition-colors">
                  Returns &amp; Exchanges
                </Link>
              </li>
              <li>
                <Link href="/shipping-information" className="text-gray-300 hover:text-white transition-colors">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/account-management" className="text-gray-300 hover:text-white transition-colors">
                  Account Management
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <Link href="/privacy-policy" className="text-gray-300 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-300 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/hipaa-compliance" className="text-gray-300 hover:text-white text-sm transition-colors">
                HIPAA Compliance
              </Link>
              <Link href="/cookie-policy" className="text-gray-300 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
            <div className="text-gray-300 text-sm">© 2025 DentyPro. All rights reserved.</div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
