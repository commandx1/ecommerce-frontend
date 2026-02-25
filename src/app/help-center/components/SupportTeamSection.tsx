import { Mail, Linkedin } from "lucide-react"
import Image from "next/image"

const team = [
  {
    name: "Sarah Mitchell",
    role: "Support Team Lead",
    bio: "15+ years dental industry experience",
    avatar:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg",
  },
  {
    name: "Michael Rodriguez",
    role: "Technical Specialist",
    bio: "Equipment & software expert",
    avatar:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
  },
  {
    name: "Jennifer Chen",
    role: "Account Manager",
    bio: "Practice setup & optimization",
    avatar:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg",
  },
  {
    name: "David Thompson",
    role: "Order Specialist",
    bio: "Logistics & fulfillment expert",
    avatar:
      "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg",
  },
]

export default function SupportTeamSection() {
  return (
    <section id="support-team" className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">
            Meet Our Support Team
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our experienced team of dental industry professionals is here to
            help you succeed
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div
              key={member.name}
              className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-20 h-20 mx-auto mb-4 overflow-hidden rounded-full relative">
                <Image
                  src={member.avatar}
                  alt={member.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <h3 className="text-lg font-semibold text-steel-blue mb-1">
                {member.name}
              </h3>
              <p className="text-gray-600 mb-2">{member.role}</p>
              <p className="text-sm text-gray-500 mb-4">{member.bio}</p>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center hover:bg-opacity-90"
                >
                  <Mail className="text-white w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center hover:bg-opacity-90"
                >
                  <Linkedin className="text-white w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
