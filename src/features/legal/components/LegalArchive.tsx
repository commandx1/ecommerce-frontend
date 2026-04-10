import { FolderOpen } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import legalAdditionalData from "@/data/legal-additional.json"

const LegalArchive = () => {
  return (
    <PageSectionContainer as="section" className="bg-surface-muted/45 py-16">
      <SectionHeading
        title="Document Archive"
        titleClassName="text-4xl text-center mb-4"
        description="Access previous versions of our legal documents and compliance materials for reference and historical purposes."
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
        className="mb-12 items-center md:items-center md:justify-center"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {legalAdditionalData.documentArchive.map((archive) => (
          <SurfaceCard key={archive.title} className="p-6 transition-shadow hover:shadow-panel">
            <div className="mb-4 flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-muted text-text-secondary">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{archive.title}</h3>
                <p className="text-sm text-text-secondary">Historical versions and changes</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              {archive.versions.map((version) => (
                <li key={version.version} className="flex justify-between items-center">
                  <span>
                    {version.version} {version.date && `(${version.date})`}
                  </span>
                  <button
                    type="button"
                    className="text-brand transition-colors hover:underline"
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
