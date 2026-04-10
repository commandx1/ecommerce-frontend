import { Book, HeadphonesIcon, HelpCircle, type LucideIcon, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import dashboardAccountData from "@/data/dashboard-account.json"

const iconMap: Record<string, LucideIcon> = {
  "question-circle": HelpCircle,
  headset: HeadphonesIcon,
  book: Book,
  phone: Phone,
}

const HelpSupport = () => {
  return (
    <section id="support-section" className="mb-8">
      <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
        <div className="border-b border-border-soft p-6">
          <h2 className="text-xl font-semibold text-text-primary">Help & Support</h2>
          <p className="mt-1 text-sm text-text-secondary">Get help and access resources</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dashboardAccountData.helpSupport.map((item) => {
              const IconComponent = iconMap[item.icon]

              return (
                <div
                  key={item.id}
                  className="cursor-pointer rounded-lg border border-border-soft p-6 text-center transition-shadow hover:shadow-soft"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand/15">
                    {IconComponent && <IconComponent className="h-6 w-6 text-xl text-brand" />}
                  </div>
                  <h3 className="mb-2 font-semibold text-text-primary">{item.title}</h3>
                  <p className="mb-4 text-sm text-text-secondary">{item.description}</p>
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm">
                    {item.action}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HelpSupport
