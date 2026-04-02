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
          <div key={card.title} className="bg-gray-50 p-6 rounded-xl">
            {CardIcon ? (
              <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center mb-4">
                <CardIcon className="text-white w-5 h-5" />
              </div>
            ) : null}
            <h4 className="font-semibold text-steel-blue mb-3">{card.title}</h4>
            {card.text ? <p className="text-sm text-gray-700 mb-3">{card.text}</p> : null}
            {card.items ? (
              <ul className="text-sm text-gray-700 space-y-2">
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
