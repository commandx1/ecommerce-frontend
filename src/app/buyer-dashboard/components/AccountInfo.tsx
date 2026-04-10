import { Bell, CreditCard, FileText, MapPin, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import dashboardAccountData from "@/data/dashboard-account.json"

const iconMap: Record<string, typeof CreditCard> = {
  "credit-card": CreditCard,
  "file-invoice": FileText,
  "map-marker-alt": MapPin,
  bell: Bell,
}

const AccountInfo = () => {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary">Account Information</h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="border-b border-border-soft pb-6 text-center">
          <Image
            src={dashboardAccountData.user.avatar}
            alt="Profile"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full mx-auto mb-3"
          />
          <h3 className="font-semibold text-text-primary">{dashboardAccountData.user.name}</h3>
          <p className="text-sm text-text-secondary">{dashboardAccountData.user.clinic}</p>
          <div className="flex items-center justify-center mt-2">
            <ShieldCheck className="mr-2 h-4 w-4 text-success" />
            <span className="text-sm text-success">Verified Professional</span>
          </div>
        </div>

        <div className="space-y-4">
          {dashboardAccountData.accountInfo.map((info) => {
            const IconComponent = iconMap[info.icon]
            return (
              <div key={info.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {IconComponent && <IconComponent className="h-4 w-4 text-text-muted" />}
                  <span className="text-sm text-text-secondary">{info.label}</span>
                </div>
                {info.value ? (
                  <span className="text-sm text-brand">{info.value}</span>
                ) : (
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-sm">
                    {info.action}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t border-border-soft pt-4">
          <Button
            type="button"
            variant="unstyled"
            className="w-full rounded-lg bg-surface-muted px-4 py-2 font-medium text-brand transition-colors hover:bg-surface"
          >
            Manage Account
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AccountInfo
