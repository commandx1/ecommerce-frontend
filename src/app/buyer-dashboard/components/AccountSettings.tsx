import { ChevronRight, Lock, type LucideIcon, MapPin, Palette, ShieldCheck, User } from "lucide-react"
import dashboardAccountData from "@/data/dashboard-account.json"

const iconMap: Record<string, LucideIcon> = {
  user: User,
  "shield-check": ShieldCheck,
  "map-marker-alt": MapPin,
  lock: Lock,
  palette: Palette,
}

const AccountSettings = () => {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary">Account Settings</h2>
        <p className="mt-1 text-sm text-text-secondary">Manage your profile and preferences</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardAccountData.settings.map((setting) => {
            const IconComponent = iconMap[setting.icon]

            return (
              <div
                key={setting.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border-soft p-4 transition-colors hover:bg-surface-muted/55"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15">
                    {IconComponent && <IconComponent className="h-5 w-5 text-brand" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{setting.title}</h3>
                    <p className="text-xs text-text-secondary">{setting.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {setting.badge && (
                    <span
                      className={`${setting.badgeColor === "green" ? "bg-success/15 text-success" : "bg-surface-muted text-text-secondary"} text-xs px-2 py-1 rounded-full`}
                    >
                      {setting.badge}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AccountSettings
