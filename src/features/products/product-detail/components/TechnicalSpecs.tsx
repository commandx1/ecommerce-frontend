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
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
}

const badgeColorMap: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
}

const TechnicalSpecs = ({ technicalSpecs, certifications }: TechnicalSpecsProps) => {
  return (
    <section className="bg-gray-50 py-12">
      <PageSectionContainer as="div">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-steel-blue mb-6">Technical Specifications</h2>
            <SurfaceCard className="p-8">
              <div className="grid grid-cols-1 gap-6">
                {technicalSpecs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex justify-between items-center border-b border-gray-200 pb-3 last:border-0"
                  >
                    <span className="font-medium text-gray-700">{spec.label}</span>
                    <span className="text-steel-blue font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-steel-blue mb-6">Certifications & Compliance</h2>
            <div className="space-y-6">
              {certifications.map((cert) => {
                const IconComponent = iconMap[cert.icon]
                const iconColorClass = colorMap[cert.iconColor] || "bg-gray-100 text-gray-600"
                const badgeColorClass = badgeColorMap[cert.badgeColor] || "bg-gray-100 text-gray-800"

                return (
                  <SurfaceCard key={cert.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-16 h-16 ${iconColorClass} rounded-xl flex items-center justify-center shrink-0`}
                      >
                        {IconComponent && <IconComponent className="text-2xl w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-steel-blue mb-2">{cert.title}</h3>
                        <p className="text-gray-600 mb-3">{cert.description}</p>
                        <span className={`${badgeColorClass} px-3 py-1 rounded-full text-sm font-medium`}>
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
