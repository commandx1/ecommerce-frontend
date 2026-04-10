import { iconMap } from "@/features/legal/components/document-section/documentIcons"
import type { LegalSectionCard } from "@/features/legal/types"

interface SectionCardsProps {
  cards: LegalSectionCard[]
}

export default function SectionCardsBlock({ cards }: SectionCardsProps) {
  const gridClassName = cards.length === 2 ? "md:grid-cols-2" : cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"

  return (
    <div className={`grid grid-cols-1 ${gridClassName} gap-6 mb-8`}>
      {cards.map((card) => {
        const CardIcon = card.icon ? iconMap[card.icon] : null
        return (
          <div key={card.title} className="rounded-[1.35rem] border border-border-soft bg-surface-muted/70 p-6">
            {CardIcon ? (
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-primary-foreground">
                <CardIcon className="h-5 w-5" />
              </div>
            ) : null}
            <h4 className="mb-3 font-semibold text-text-primary">{card.title}</h4>
            {card.text ? <p className="mb-3 text-sm text-text-secondary">{card.text}</p> : null}
            {card.items ? (
              <ul className="space-y-2 text-sm text-text-secondary">
                {card.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
