import AccountInfo from "./components/AccountInfo"
import AccountSettings from "./components/AccountSettings"
import BuyerHeader from "./components/BuyerHeader"
import DashboardSidebar from "./components/DashboardSidebar"
import HelpSupport from "./components/HelpSupport"
import MetricsCards from "./components/MetricsCards"
import Notifications from "./components/Notifications"
import PaymentSummary from "./components/PaymentSummary"
import QuickReorder from "./components/QuickReorder"
import RecentInvoices from "./components/RecentInvoices"
import RecentOrders from "./components/RecentOrders"
import SavedSuppliers from "./components/SavedSuppliers"
import SpendingChart from "./components/SpendingChart"
import TopSuppliers from "./components/TopSuppliers"
import WelcomeSection from "./components/WelcomeSection"

export default function BuyerDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-light-mint-gray">
      <BuyerHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main id="main-content" className="flex-1 p-6">
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
        </main>
      </div>
    </div>
  )
}
