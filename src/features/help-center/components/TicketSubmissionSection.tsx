import TicketSubmissionForm from "@/features/help-center/components/TicketSubmissionForm"
import TicketSubmissionHighlights from "@/features/help-center/components/TicketSubmissionHighlights"

export default function TicketSubmissionSection() {
  return (
    <section className="py-16 bg-light-mint-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Submit a Support Ticket</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            For complex issues or detailed requests, submit a support ticket. Our technical team will provide
            comprehensive assistance with tracking and follow-up.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <TicketSubmissionHighlights />
            <TicketSubmissionForm />
          </div>
        </div>
      </div>
    </section>
  )
}
