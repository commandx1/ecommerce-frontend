import { Book, HeadphonesIcon, HelpCircle, type LucideIcon, Phone } from "lucide-react"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-steel-blue">Help & Support</h2>
          <p className="text-sm text-gray-600 mt-1">Get help and access resources</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardAccountData.helpSupport.map((item) => {
              const IconComponent = iconMap[item.icon]

              return (
                <div
                  key={item.id}
                  className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-12 h-12 bg-steel-blue/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    {IconComponent && <IconComponent className="text-steel-blue text-xl w-6 h-6" />}
                  </div>
                  <h3 className="font-semibold text-steel-blue mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  <button type="button" className="text-steel-blue hover:underline text-sm font-medium">
                    {item.action}
                  </button>
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
