import { BookOpen, Download, Users, Video } from "lucide-react"

import SupportResourceCard from "./SupportResourceCard"

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
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Additional Support Resources</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive library of resources designed to help you get the most out of DentalHub
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((item) => (
            <SupportResourceCard
              key={item.title}
              title={item.title}
              description={item.description}
              label={item.label}
              Icon={item.icon}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
