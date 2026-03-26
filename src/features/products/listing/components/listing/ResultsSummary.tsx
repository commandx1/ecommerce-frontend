interface ResultsSummaryProps {
  totalElements: number
}

const ResultsSummary = ({ totalElements }: ResultsSummaryProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-steel-blue mb-2">{totalElements} Products Found</h2>
          <p className="text-gray-600">Showing all dental products from our marketplace</p>
        </div>
      </div>
    </div>
  )
}

export default ResultsSummary
