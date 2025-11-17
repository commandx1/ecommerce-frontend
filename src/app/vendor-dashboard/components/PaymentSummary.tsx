import { CreditCard } from "lucide-react"
import dashboardInvoicesData from "@/data/dashboard-invoices.json"

const PaymentSummary = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-steel-blue">Payment Summary</h2>
        <p className="text-sm text-gray-600 mt-1">Current month overview</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-light-mint-gray rounded-lg">
            <div className="text-2xl font-bold text-steel-blue">{dashboardInvoicesData.paymentSummary.totalSpent}</div>
            <div className="text-sm text-gray-600 mt-1">Total Spent</div>
          </div>
          <div className="text-center p-4 bg-light-mint-gray rounded-lg">
            <div className="text-2xl font-bold text-steel-blue">{dashboardInvoicesData.paymentSummary.outstanding}</div>
            <div className="text-sm text-gray-600 mt-1">Outstanding</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Payment Methods</span>
          </div>

          {dashboardInvoicesData.paymentSummary.paymentMethods.map((method) => {
            const iconColorClass =
              method.iconColor === "blue"
                ? "bg-blue-100"
                : method.iconColor === "orange"
                  ? "bg-orange-100"
                  : "bg-gray-100"
            const textColorClass =
              method.iconColor === "blue"
                ? "text-blue-600"
                : method.iconColor === "orange"
                  ? "text-orange-600"
                  : "text-gray-600"

            return (
              <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${iconColorClass} rounded flex items-center justify-center`}>
                    <CreditCard className={`${textColorClass} w-4 h-4`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-steel-blue">**** {method.last4}</div>
                    <div className="text-xs text-gray-500">{method.label}</div>
                  </div>
                </div>
                <button type="button" className="text-steel-blue hover:underline text-xs">
                  Edit
                </button>
              </div>
            )
          })}

          <button
            type="button"
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            + Add Payment Method
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSummary
