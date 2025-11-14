const WelcomeSection = () => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <section id="welcome-section" className="mb-8">
      <div className="bg-gradient-to-r from-steel-blue to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Dr. Johnson!</h1>
            <p className="text-blue-100 text-lg">Here&apos;s what&apos;s happening with your dental supply orders</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Today&apos;s Date</div>
            <div className="text-xl font-semibold">{today}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default WelcomeSection
