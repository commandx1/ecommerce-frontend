import { Linkedin, Mail } from "lucide-react"
import Image from "next/image"

interface SupportTeamMemberCardProps {
  name: string
  role: string
  bio: string
  avatar: string
}

const SupportTeamMemberCard = ({ name, role, bio, avatar }: SupportTeamMemberCardProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
      <div className="w-20 h-20 mx-auto mb-4 overflow-hidden rounded-full relative">
        <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
      </div>
      <h3 className="text-lg font-semibold text-steel-blue mb-1">{name}</h3>
      <p className="text-gray-600 mb-2">{role}</p>
      <p className="text-sm text-gray-500 mb-4">{bio}</p>
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
  )
}

export default SupportTeamMemberCard
