import type { LucideIcon } from "lucide-react"

interface ContactSupportChannelCardProps {
  title: string
  description: string
  value: string
  Icon: LucideIcon
}

const ContactSupportChannelCard = ({ title, description, value, Icon }: ContactSupportChannelCardProps) => {
  return (
    <div className="rounded-[1.35rem] border border-white/12 bg-white/8 p-6 backdrop-blur-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-strong text-accent-foreground">
        <Icon className="h-6 w-6" />
      </div>
      {/* `--inverse-foreground`, not `--inverse-muted`/`--accent-strong`: those fail AA contrast on
          this card's blue. Emphasis comes from `font-semibold` instead. */}
      <h3 className="text-lg font-semibold mb-2 text-inverse-foreground">{title}</h3>
      <p className="mb-3 text-sm text-inverse-foreground">{description}</p>
      <p className="font-semibold text-inverse-foreground">{value}</p>
    </div>
  )
}

export default ContactSupportChannelCard
