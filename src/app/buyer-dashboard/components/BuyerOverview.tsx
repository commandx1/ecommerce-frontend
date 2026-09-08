/**
 * Buyer dashboard overview. Dummy veriyle çalıştığı için şimdilik hiçbir route'a
 * bağlı değil - backend'e bağlandığında buyer-dashboard/page.tsx bunu render edecek.
 */
import AccountInfo from "./AccountInfo"
import AccountSettings from "./AccountSettings"
import HelpSupport from "./HelpSupport"
import MetricsCards from "./MetricsCards"
import Notifications from "./Notifications"
import PaymentSummary from "./PaymentSummary"
import QuickReorder from "./QuickReorder"
import RecentInvoices from "./RecentInvoices"
import RecentOrders from "./RecentOrders"
import SavedSuppliers from "./SavedSuppliers"
import SpendingChart from "./SpendingChart"
import TopSuppliers from "./TopSuppliers"
import WelcomeSection from "./WelcomeSection"

export default function BuyerOverview() {
  return (
    <>
      <WelcomeSection />
      <MetricsCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <QuickReorder />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <SpendingChart />
        <TopSuppliers />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <SavedSuppliers />
        </div>
        <AccountInfo />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <RecentInvoices />
        <PaymentSummary />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <AccountSettings />
        <Notifications />
      </div>
      <HelpSupport />
    </>
  )
}
