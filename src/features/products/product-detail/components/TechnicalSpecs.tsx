import { Award, Lock, type LucideIcon, ShieldCheck } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SurfaceCard from "@/components/ui/SurfaceCard"

interface TechnicalSpec {
  label: string
  value: string
}

interface Certification {
  id: number
  icon: string
  iconColor: string
  title: string
  description: string
  badge: string
  badgeColor: string
}

interface TechnicalSpecsProps {
  technicalSpecs: TechnicalSpec[]
  certifications: Certification[]
}

const iconMap: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  certificate: Award,
  lock: Lock,
}

const colorMap: Record<string, string> = {
  green: "bg-success/14 text-success",
  blue: "bg-accent text-brand",
  purple: "bg-brand/12 text-brand",
}

const badgeColorMap: Record<string, string> = {
  green: "bg-success/14 text-success",
  blue: "bg-accent text-brand",
  purple: "bg-brand/12 text-brand",
}

const TechnicalSpecs = ({ technicalSpecs, certifications }: TechnicalSpecsProps) => {
  return (
    <section className="bg-surface-muted/45 py-10 sm:py-12">
      <PageSectionContainer as="div">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-text-primary sm:text-3xl">Technical Specifications</h2>
            <SurfaceCard className="p-5 sm:p-8">
              <div className="grid grid-cols-1 gap-6">
                {technicalSpecs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center justify-between border-b border-border-soft pb-3 last:border-0"
                  >
                    <span className="font-medium text-text-secondary">{spec.label}</span>
                    <span className="font-semibold text-brand">{spec.value}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>

          <div>
            <h2 className="mb-6 text-2xl font-semibold text-text-primary sm:text-3xl">Certifications & Compliance</h2>
            <div className="space-y-6">
              {certifications.map((cert) => {
                const IconComponent = iconMap[cert.icon]
                const iconColorClass = colorMap[cert.iconColor] || "bg-surface-muted text-text-secondary"
                const badgeColorClass = badgeColorMap[cert.badgeColor] || "bg-surface-muted text-text-secondary"

                return (
                  <SurfaceCard key={cert.id} className="p-4 sm:p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${iconColorClass}`}
                      >
                        {IconComponent && <IconComponent className="text-2xl w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="mb-2 text-xl font-semibold text-text-primary">{cert.title}</h3>
                        <p className="mb-3 text-text-secondary">{cert.description}</p>
                        <span className={`${badgeColorClass} rounded-full px-3 py-1 text-sm font-medium`}>
                          {cert.badge}
                        </span>
                      </div>
                    </div>
                  </SurfaceCard>
                )
              })}
            </div>
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default TechnicalSpecs
