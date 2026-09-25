import { ExternalLink, FileText } from "lucide-react"
import type { SpecificationItem } from "../types"

interface ProductSpecificationsProps {
  specifications: SpecificationItem[]
  sdsUrl: string | null
}

export default function ProductSpecifications({ specifications, sdsUrl }: ProductSpecificationsProps) {
  if (specifications.length === 0 && !sdsUrl) return null

  return (
    <div className="rounded-[1.75rem] border border-border-soft bg-surface-elevated p-5 shadow-soft sm:p-8">
      {specifications.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
          {specifications.map((spec, index) => (
            <div
              key={`${spec.label}-${index}`}
              // Divider on top, not bottom: in a two-column grid `last:border-0` only exempts one cell
              // of the final row, while exempting the first row works for any attribute count.
              className="flex items-center justify-between gap-4 border-border-soft border-t py-3 first:border-t-0 md:[&:nth-child(-n+2)]:border-t-0"
            >
              <dt className="text-text-muted">{spec.label}</dt>
              <dd className="break-words text-right font-medium text-text-primary">{spec.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {sdsUrl ? (
        <a
          href={sdsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 text-sm font-medium text-brand hover:underline ${
            specifications.length > 0 ? "mt-6 border-t border-border-soft pt-6" : ""
          }`}
        >
          <FileText className="h-4 w-4" />
          Safety Data Sheet (SDS)
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  )
}
