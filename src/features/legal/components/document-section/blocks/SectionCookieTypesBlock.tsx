import { iconMap } from "@/features/legal/components/document-section/documentIcons"
import type { LegalCookieType } from "@/features/legal/types"

interface SectionCookieTypesProps {
  cookies: LegalCookieType[]
}

export default function SectionCookieTypesBlock({ cookies }: SectionCookieTypesProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cookies.map((cookie) => {
        const CookieIcon = iconMap[cookie.icon]
        return (
          <div
            key={cookie.title}
            className="rounded-[1.2rem] border border-border-soft bg-surface-muted/70 p-4 text-center"
          >
            {CookieIcon ? (
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-primary-foreground">
                <CookieIcon className="h-6 w-6" />
              </div>
            ) : null}
            <h4 className="mb-2 font-semibold text-text-primary">{cookie.title}</h4>
            <p className="text-xs text-text-secondary">{cookie.description}</p>
          </div>
        )
      })}
    </div>
  )
}
