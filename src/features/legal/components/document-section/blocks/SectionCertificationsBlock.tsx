import { iconMap } from "@/features/legal/components/document-section/documentIcons"
import type { LegalCertification } from "@/features/legal/types"

interface SectionCertificationsProps {
  certifications: LegalCertification[]
}

export default function SectionCertificationsBlock({ certifications }: SectionCertificationsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {certifications.map((cert) => {
        const CertIcon = iconMap[cert.icon]
        return (
          <div key={cert.title} className="bg-gray-50 p-6 rounded-xl text-center">
            {CertIcon ? (
              <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <CertIcon className="text-white w-8 h-8" />
              </div>
            ) : null}
            <h4 className="font-semibold text-steel-blue mb-2">{cert.title}</h4>
            <p className="text-xs text-gray-600 mb-3">{cert.description}</p>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{cert.status}</span>
          </div>
        )
      })}
    </div>
  )
}
