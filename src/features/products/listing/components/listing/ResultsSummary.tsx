interface ResultsSummaryProps {
  totalElements: number
}

const ResultsSummary = ({ totalElements }: ResultsSummaryProps) => {
  return (
    <div className="mb-6 rounded-2xl border border-border-soft bg-surface-elevated p-4 shadow-soft sm:mb-8 sm:p-6">
      <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <div>
          <h2 className="mb-1.5 text-lg font-bold text-text-primary sm:mb-2 sm:text-2xl">
            {totalElements} Products Found
          </h2>
          <p className="text-sm text-text-secondary sm:text-base">Showing all dental products from our marketplace</p>
        </div>
      </div>
    </div>
  )
}

export default ResultsSummary
