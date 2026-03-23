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
    <section id="support-team" className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Meet Our Support Team</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our experienced team of dental industry professionals is here to help you succeed
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      </div>
    </section>
  )
}
