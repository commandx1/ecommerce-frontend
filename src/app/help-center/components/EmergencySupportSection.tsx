import { AlertTriangle, Mail, MessageCircle, Phone } from "lucide-react"

export default function EmergencySupportSection() {
  return (
    <section id="emergency-support" className="py-16 bg-coral-orange">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-white w-10 h-10" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Emergency Support</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
            Need immediate assistance with a critical issue? Our emergency support line is available 24/7 for urgent
            matters that impact patient care.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Phone className="text-white w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Emergency Hotline</h3>
              <p className="text-orange-100 text-lg font-medium">1-800-URGENT-1</p>
              <p className="text-orange-200 text-sm mt-1">Available 24/7/365</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <MessageCircle className="text-white w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Priority Chat</h3>
              <p className="text-orange-100 text-lg font-medium">Instant Response</p>
              <p className="text-orange-200 text-sm mt-1">Skip the queue</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Mail className="text-white w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Priority Email</h3>
              <p className="text-orange-100 text-lg font-medium">urgent@dentalhub.com</p>
              <p className="text-orange-200 text-sm mt-1">15-minute response</p>
            </div>
          </div>

          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-orange-100 text-sm">
              <strong>Emergency support is reserved for:</strong> Equipment failures affecting patient care, critical
              order issues, payment processing emergencies, and system outages preventing essential operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
