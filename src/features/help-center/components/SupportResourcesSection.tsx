import { BookOpen, Download, Users, Video } from "lucide-react"

import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"

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
    <PageSectionContainer as="section" className="bg-canvas py-16">
      <SectionHeading
        title="Additional Support Resources"
        description="Explore our comprehensive library of resources designed to help you get the most out of DentalHub"
        className="mb-12 justify-center"
        titleClassName="text-4xl text-center mb-4"
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
    </PageSectionContainer>
  )
}
