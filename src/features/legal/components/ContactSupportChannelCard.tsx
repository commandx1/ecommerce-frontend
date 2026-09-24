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
      {/* These sit on the hero's dark blue, and axe measured them failing there: `--inverse-muted`
          at 3.84:1 and `--accent-strong` at 2.78:1 (both below AA's 4.5). `--inverse-muted` is the
          secondary tone for dark surfaces, but this card's blue is lighter than the surfaces it
          was tuned against. `--inverse-foreground` is the same palette's primary dark-surface tone
          and clears AA here; the value keeps its emphasis through `font-semibold`, not through a
          colour that cannot be read. */}
      <h3 className="text-lg font-semibold mb-2 text-inverse-foreground">{title}</h3>
      <p className="mb-3 text-sm text-inverse-foreground">{description}</p>
      <p className="font-semibold text-inverse-foreground">{value}</p>
    </div>
  )
}

export default ContactSupportChannelCard
