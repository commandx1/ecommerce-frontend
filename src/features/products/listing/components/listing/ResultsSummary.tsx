interface ResultsSummaryProps {
  totalElements: number
}

const ResultsSummary = ({ totalElements }: ResultsSummaryProps) => {
  return (
    <div className="mb-8 rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-text-primary">{totalElements} Products Found</h2>
          <p className="text-text-secondary">Showing all dental products from our marketplace</p>
        </div>
      </div>
    </div>
  )
}

export default ResultsSummary
