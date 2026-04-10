import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import SupportTeamMemberCard from "./SupportTeamMemberCard"

const team = [
  {
    name: "Sarah Mitchell",
    role: "Support Team Lead",
    bio: "15+ years dental industry experience",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg",
  },
  {
    name: "Michael Rodriguez",
    role: "Technical Specialist",
    bio: "Equipment & software expert",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
  },
  {
    name: "Jennifer Chen",
    role: "Account Manager",
    bio: "Practice setup & optimization",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg",
  },
  {
    name: "David Thompson",
    role: "Order Specialist",
    bio: "Logistics & fulfillment expert",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg",
  },
]

export default function SupportTeamSection() {
  return (
    <PageSectionContainer as="section" className="bg-surface-muted/45 py-16">
      <SectionHeading
        title="Meet Our Support Team"
        description="Our experienced team of dental industry professionals is here to help you succeed"
        className="mb-12 justify-center"
        titleClassName="text-4xl text-center mb-4"
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {team.map((member) => (
          <SupportTeamMemberCard
            key={member.name}
            name={member.name}
            role={member.role}
            bio={member.bio}
            avatar={member.avatar}
          />
        ))}
      </div>
    </PageSectionContainer>
  )
}
