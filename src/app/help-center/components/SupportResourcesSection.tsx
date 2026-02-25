import { BookOpen, Video, Download, Users } from "lucide-react"
import Link from "next/link"

const resources = [
  {
    icon: BookOpen,
    title: "User Guide",
    description: "Comprehensive guide to using all platform features",
    label: "Read Guide →",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step video guides for common tasks",
    label: "Watch Videos →",
  },
  {
    icon: Download,
    title: "Downloads",
    description: "Forms, catalogs, and mobile app downloads",
    label: "View Downloads →",
  },
  {
    icon: Users,
    title: "Community",
    description: "Connect with other dental professionals",
    label: "Join Community →",
  },
]

export default function SupportResourcesSection() {
  return (
    <section id="support-resources" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">
            Additional Support Resources
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive library of resources designed to help you
            get the most out of DentalHub
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-light-mint-gray rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="w-14 h-14 bg-steel-blue rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-90 transition-colors">
                  <Icon className="text-white w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-steel-blue mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <Link
                  href="#"
                  className="text-steel-blue font-medium hover:underline"
                >
                  {item.label}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
