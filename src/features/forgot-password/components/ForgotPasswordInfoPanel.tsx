import { Check, Headset, ShieldCheck } from "lucide-react"

const SECURITY_POINTS = [
  {
    title: "Email Verification",
    description: "We'll send a secure reset link to your registered email address.",
  },
  {
    title: "Time-Limited Access",
    description: "Reset links expire after 24 hours for maximum security.",
  },
  {
    title: "Account Protection",
    description: "Your data and order history remain fully protected.",
  },
]

export default function ForgotPasswordInfoPanel() {
  return (
    <div className="hidden lg:block">
      <div className="bg-linear-to-br from-steel-blue to-blue-800 rounded-3xl p-12 text-white h-full">
        <div className="mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="text-pale-lime w-8 h-8" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Secure Password Recovery</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            We take the security of your data seriously. Our password recovery process ensures only you can access your
            account.
          </p>
        </div>

        <div className="space-y-6">
          {SECURITY_POINTS.map((item) => (
            <div key={item.title} className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center shrink-0 mt-1">
                <Check className="text-steel-blue w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-blue-100 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-pale-lime rounded-xl flex items-center justify-center">
              <Headset className="text-steel-blue w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Need Help?</h3>
              <p className="text-blue-100 text-sm">Contact our support team at support@dentypro.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
