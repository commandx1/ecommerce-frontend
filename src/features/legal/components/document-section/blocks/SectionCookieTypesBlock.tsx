import { iconMap } from "@/features/legal/components/document-section/documentIcons"
import type { LegalCookieType } from "@/features/legal/types"

interface SectionCookieTypesProps {
  cookies: LegalCookieType[]
}

export default function SectionCookieTypesBlock({ cookies }: SectionCookieTypesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cookies.map((cookie) => {
        const CookieIcon = iconMap[cookie.icon]
        return (
          <div key={cookie.title} className="bg-gray-50 p-4 rounded-xl text-center">
            {CookieIcon ? (
              <div className="w-12 h-12 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <CookieIcon className="text-white w-6 h-6" />
              </div>
            ) : null}
            <h4 className="font-semibold text-steel-blue mb-2">{cookie.title}</h4>
            <p className="text-xs text-gray-600">{cookie.description}</p>
          </div>
        )
      })}
    </div>
  )
}
