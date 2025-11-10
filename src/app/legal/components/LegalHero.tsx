import { Download, Phone, Scale } from "lucide-react"
import Link from "next/link"

const LegalHero = () => {
  return (
    <section id="hero-section" className="bg-gradient-to-br from-steel-blue to-blue-800 h-[400px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Legal & Compliance Center</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Access comprehensive legal documents, compliance guidelines, and regulatory information for your dental
            practice operations on DentalHub.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              className="bg-pale-lime text-steel-blue px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download All Documents
            </button>
            <Link
              href="#contact-support"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-steel-blue transition-colors flex items-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              Legal Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LegalHero
