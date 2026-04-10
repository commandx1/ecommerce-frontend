import { Linkedin, Mail } from "lucide-react"
import Image from "next/image"
import SurfaceCard from "@/components/ui/SurfaceCard"

interface SupportTeamMemberCardProps {
  name: string
  role: string
  bio: string
  avatar: string
}

const SupportTeamMemberCard = ({ name, role, bio, avatar }: SupportTeamMemberCardProps) => {
  return (
    <SurfaceCard className="p-6 text-center transition-shadow hover:shadow-soft">
      <div className="w-20 h-20 mx-auto mb-4 overflow-hidden rounded-full relative">
        <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-text-primary">{name}</h3>
      <p className="mb-2 text-text-secondary">{role}</p>
      <p className="mb-4 text-sm text-text-muted">{bio}</p>
      <div className="flex justify-center space-x-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-primary-foreground hover:bg-brand-strong"
        >
          <Mail className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-primary-foreground hover:bg-brand-strong"
        >
          <Linkedin className="h-3 w-3" />
        </button>
      </div>
    </SurfaceCard>
  )
}

export default SupportTeamMemberCard
