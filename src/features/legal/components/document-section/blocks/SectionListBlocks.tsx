interface SectionListProps {
  items: string[]
}

export function SectionList({ items }: SectionListProps) {
  return (
    <ul className="mb-6 ml-4 list-inside list-disc space-y-2 text-text-secondary">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function SectionItems({ items }: SectionListProps) {
  return (
    <ul className="mb-6 space-y-2 text-text-secondary">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  )
}

export function SectionWarningItems({ items }: SectionListProps) {
  const midpoint = Math.ceil(items.length / 2)

  return (
    <div className="mb-6 rounded-2xl border border-danger/25 bg-danger/10 p-6">
      <h4 className="mb-3 font-semibold text-danger">You may not use our Service:</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ul className="space-y-2 text-sm text-text-secondary">
          {items.slice(0, midpoint).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <ul className="space-y-2 text-sm text-text-secondary">
          {items.slice(midpoint).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
