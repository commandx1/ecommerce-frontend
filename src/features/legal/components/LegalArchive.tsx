import { FolderOpen } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import legalAdditionalData from "@/data/legal-additional.json"

const LegalArchive = () => {
  return (
    <PageSectionContainer as="section" className="py-16 bg-gray-50">
      <SectionHeading
        title="Document Archive"
        titleClassName="text-4xl text-center mb-4"
        description="Access previous versions of our legal documents and compliance materials for reference and historical purposes."
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
        className="mb-12 justify-center"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {legalAdditionalData.documentArchive.map((archive) => (
          <SurfaceCard key={archive.title} className="p-6 hover:shadow-xl transition-shadow">
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
          </SurfaceCard>
        ))}
      </div>
    </PageSectionContainer>
  )
}

export default LegalArchive
