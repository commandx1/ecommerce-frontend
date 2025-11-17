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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-steel-blue">Account Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your profile and preferences</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardAccountData.settings.map((setting) => {
            const IconComponent = iconMap[setting.icon]

            return (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-light-mint-gray transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-steel-blue/10 rounded-lg flex items-center justify-center">
                    {IconComponent && <IconComponent className="text-steel-blue w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-blue text-sm">{setting.title}</h3>
                    <p className="text-xs text-gray-600">{setting.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {setting.badge && (
                    <span
                      className={`${setting.badgeColor === "green" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"} text-xs px-2 py-1 rounded-full`}
                    >
                      {setting.badge}
                    </span>
                  )}
                  <ChevronRight className="text-gray-400 w-4 h-4" />
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
