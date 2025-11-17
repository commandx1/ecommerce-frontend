import { Bell, CreditCard, FileText, MapPin, ShieldCheck } from "lucide-react"
import Image from "next/image"
import dashboardAccountData from "@/data/dashboard-account.json"

const iconMap: Record<string, typeof CreditCard> = {
  "credit-card": CreditCard,
  "file-invoice": FileText,
  "map-marker-alt": MapPin,
  bell: Bell,
}

const AccountInfo = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-steel-blue">Account Information</h2>
      </div>
      <div className="p-6 space-y-6">
        <div className="text-center pb-6 border-b border-gray-200">
          <Image
            src={dashboardAccountData.user.avatar}
            alt="Profile"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full mx-auto mb-3"
          />
          <h3 className="font-semibold text-steel-blue">{dashboardAccountData.user.name}</h3>
          <p className="text-sm text-gray-600">{dashboardAccountData.user.clinic}</p>
          <div className="flex items-center justify-center mt-2">
            <ShieldCheck className="text-green-500 mr-2 w-4 h-4" />
            <span className="text-sm text-green-600">Verified Professional</span>
          </div>
        </div>

        <div className="space-y-4">
          {dashboardAccountData.accountInfo.map((info) => {
            const IconComponent = iconMap[info.icon]
            return (
              <div key={info.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {IconComponent && <IconComponent className="text-gray-500 w-4 h-4" />}
                  <span className="text-sm text-gray-700">{info.label}</span>
                </div>
                {info.value ? (
                  <span className="text-sm text-steel-blue">{info.value}</span>
                ) : (
                  <button type="button" className="text-sm text-steel-blue hover:underline">
                    {info.action}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            className="w-full bg-light-mint-gray text-steel-blue py-2 px-4 rounded-lg hover:bg-opacity-80 font-medium"
          >
            Manage Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountInfo
