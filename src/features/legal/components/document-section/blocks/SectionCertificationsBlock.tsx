import { iconMap } from "@/features/legal/components/document-section/documentIcons"
import type { LegalCertification } from "@/features/legal/types"

interface SectionCertificationsProps {
  certifications: LegalCertification[]
}

export default function SectionCertificationsBlock({ certifications }: SectionCertificationsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {certifications.map((cert) => {
        const CertIcon = iconMap[cert.icon]
        return (
          <div
            key={cert.title}
            className="rounded-[1.35rem] border border-border-soft bg-surface-muted/70 p-6 text-center"
          >
            {CertIcon ? (
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-primary-foreground">
                <CertIcon className="h-8 w-8" />
              </div>
            ) : null}
            <h4 className="mb-2 font-semibold text-text-primary">{cert.title}</h4>
            <p className="mb-3 text-xs text-text-secondary">{cert.description}</p>
            <span className="rounded-full bg-success/14 px-2 py-1 text-xs text-success">{cert.status}</span>
          </div>
        )
      })}
    </div>
  )
}
