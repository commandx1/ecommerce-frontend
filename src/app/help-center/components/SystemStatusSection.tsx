import SystemAnnouncementCard from "./SystemAnnouncementCard"
import SystemStatusCard from "./SystemStatusCard"

const statusItems = [
  { name: "Website & Platform", status: "Operational", color: "green" },
  { name: "Order Processing", status: "Operational", color: "green" },
  { name: "Payment Gateway", status: "Operational", color: "green" },
  { name: "Mobile App", status: "Minor Issues", color: "yellow" },
  { name: "Support Systems", status: "Operational", color: "green" },
] as const

const announcements = [
  {
    type: "Platform Update",
    dotColor: "bg-blue-500",
    date: "Nov 1, 2024",
    title: "Enhanced Search Functionality",
    description: "New advanced filters and AI-powered search suggestions now available across all product categories.",
  },
  {
    type: "New Feature",
    dotColor: "bg-green-500",
    date: "Oct 28, 2024",
    title: "Mobile App 2.0 Released",
    description: "Redesigned mobile experience with faster performance and new inventory management features.",
  },
  {
    type: "Maintenance",
    dotColor: "bg-yellow-500",
    date: "Oct 25, 2024",
    title: "Scheduled Maintenance - Nov 15",
    description: "Platform will be offline from 2-4 AM EST for routine maintenance and performance improvements.",
  },
  {
    type: "Partnership",
    dotColor: "bg-purple-500",
    date: "Oct 20, 2024",
    title: "New Supplier Partners Added",
    description: "Welcome 15 new certified suppliers specializing in orthodontic and endodontic products.",
  },
]

export default function SystemStatusSection() {
  return (
    <section id="system-status" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">System Status & Updates</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed about platform performance, scheduled maintenance, and new feature releases
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-light-mint-gray rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-steel-blue">Current System Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-green-600 font-medium">All Systems Operational</span>
              </div>
            </div>

            <div className="space-y-4">
              {statusItems.map((item) => (
                <SystemStatusCard key={item.name} name={item.name} status={item.status} color={item.color} />
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-medium"
              >
                View Detailed Status Page
              </button>
            </div>
          </div>

          <div className="bg-light-mint-gray rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-steel-blue mb-6">Recent Updates & Announcements</h3>

            <div className="space-y-6">
              {announcements.map((announcement) => (
                <SystemAnnouncementCard
                  key={announcement.title}
                  type={announcement.type}
                  dotColor={announcement.dotColor}
                  date={announcement.date}
                  title={announcement.title}
                  description={announcement.description}
                />
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full border border-steel-blue text-steel-blue py-3 px-6 rounded-lg hover:bg-steel-blue hover:text-white font-medium transition-colors"
              >
                View All Announcements
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
