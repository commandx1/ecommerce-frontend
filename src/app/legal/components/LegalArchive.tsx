import { FolderOpen } from "lucide-react"
import legalAdditionalData from "@/data/legal-additional.json"

const LegalArchive = () => {
  return (
    <section id="document-archive" className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Document Archive</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access previous versions of our legal documents and compliance materials for reference and historical
            purposes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {legalAdditionalData.documentArchive.map((archive) => (
            <div key={archive.title} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <FolderOpen className="text-gray-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-steel-blue">{archive.title}</h3>
                  <p className="text-sm text-gray-600">Historical versions and changes</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {archive.versions.map((version) => (
                  <li key={version.version} className="flex justify-between items-center">
                    <span>
                      {version.version} {version.date && `(${version.date})`}
                    </span>
                    <button
                      type="button"
                      className="text-steel-blue hover:underline transition-colors"
                      aria-label={`View ${version.version}`}
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LegalArchive
