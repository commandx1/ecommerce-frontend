import { useId } from "react"

const DashboardHeader = () => {
  const sectionId = useId()

  return (
    <section id={sectionId} className="mb-8">
      <h1 className="text-3xl font-bold text-text-primary">Vendor Dashboard</h1>
      <p className="mt-1 text-text-secondary">Welcome back, DentalPro Supply. Here&apos;s your business overview.</p>
    </section>
  )
}

export default DashboardHeader
