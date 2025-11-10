"use client"

import {
  AlertTriangle,
  Award,
  Building,
  ChartBar,
  CheckCircle2,
  ClipboardList,
  Cog,
  Cookie,
  CreditCard,
  Database,
  Download,
  FileText,
  Gavel,
  Handshake,
  Info,
  Lock,
  type LucideIcon,
  Monitor,
  MousePointer,
  Printer,
  Server,
  Shield,
  ShieldCheck,
  ShoppingBag,
  User,
  UserCog,
  Volume2,
} from "lucide-react"

interface DocumentSectionProps {
  document: {
    id: string
    title: string
    subtitle?: string
    lastUpdated?: string
    icon?: string
    notice?: {
      type: "warning" | "success" | "info" | "error"
      title: string
      text: string
    }
    sections?: Array<{
      title: string
      content?: string
      list?: string[]
      items?: string[]
      cards?: Array<{
        title: string
        icon?: string
        text?: string
        items?: string[]
      }>
      warning?: boolean
      pricing?: Array<{
        value: string
        label: string
        note: string
      }>
      steps?: Array<{
        step: number
        title: string
        description: string
      }>
      paymentOptions?: Array<{
        title: string
        items: string[]
      }>
      cookieTypes?: Array<{
        title: string
        icon: string
        description: string
      }>
      managementOptions?: Array<{
        title: string
        description: string
      }>
      deviceClasses?: Array<{
        class: string
        items: string[]
      }>
      certifications?: Array<{
        title: string
        icon: string
        description: string
        status: string
      }>
      securityStandards?: Array<{
        title: string
        items: string[]
      }>
      reports?: Array<{
        title: string
        description: string
        period: string
        auditor: string
        status: string
      }>
    }>
  }
}

const iconMap: Record<string, LucideIcon> = {
  "file-contract": FileText,
  "shield-check": ShieldCheck,
  "user-md": User,
  handshake: Handshake,
  "shopping-bag": ShoppingBag,
  database: Database,
  "cookie-bite": Cookie,
  gavel: Gavel,
  certificate: Award,
  "clipboard-list": ClipboardList,
  user: User,
  "mouse-pointer": MousePointer,
  cog: Cog,
  lock: Lock,
  "shield-alt": Shield,
  building: Building,
  desktop: Monitor,
  server: Server,
  "chart-bar": ChartBar,
  bullhorn: Volume2,
  "user-cog": UserCog,
  "credit-card": CreditCard,
}

const noticeIconMap: Record<string, LucideIcon> = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
}

const noticeColorMap: Record<string, string> = {
  warning: "bg-coral-orange/10 border-coral-orange text-coral-orange",
  success: "bg-green-50 border-green-500 text-green-500",
  info: "bg-blue-50 border-blue-500 text-blue-500",
  error: "bg-red-50 border-red-500 text-red-500",
}

const DocumentSection = ({ document }: DocumentSectionProps) => {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Placeholder for PDF download functionality
    alert("PDF download functionality would be implemented here. This would generate a PDF version of the document.")
  }

  const IconComponent = document.icon ? iconMap[document.icon] : FileText

  return (
    <section id={document.id} className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center mr-4">
            {IconComponent && <IconComponent className="text-white w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-steel-blue">{document.title}</h2>
            {document.subtitle && <p className="text-gray-600">{document.subtitle}</p>}
            {document.lastUpdated && <p className="text-gray-600">Last updated: {document.lastUpdated}</p>}
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handlePrint}
            className="bg-light-mint-gray text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-80 font-medium flex items-center transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="prose max-w-none">
        {document.notice &&
          (() => {
            const NoticeIcon = noticeIconMap[document.notice.type]
            return (
              <div className={`${noticeColorMap[document.notice.type]} border-l-4 p-4 rounded-r-lg mb-6`}>
                <div className="flex items-start">
                  {NoticeIcon && <NoticeIcon className="mr-3 mt-1 w-5 h-5 shrink-0" />}
                  <div>
                    <p className="font-semibold text-gray-800">{document.notice.title}</p>
                    <p className="text-gray-700 text-sm">{document.notice.text}</p>
                  </div>
                </div>
              </div>
            )
          })()}

        {document.sections?.map((section) => (
          <div key={section.title} className="mb-8">
            <h3 className="text-xl font-semibold text-steel-blue mb-4">{section.title}</h3>
            {section.content && <p className="text-gray-700 mb-6 leading-relaxed">{section.content}</p>}

            {section.list && (
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}

            {section.items && section.warning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-red-800 mb-3">You may not use our Service:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="text-sm text-red-700 space-y-2">
                    {section.items.slice(0, Math.ceil(section.items.length / 2)).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <ul className="text-sm text-red-700 space-y-2">
                    {section.items.slice(Math.ceil(section.items.length / 2)).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {section.items && !section.warning && (
              <ul className="text-gray-700 mb-6 space-y-2">
                {section.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}

            {section.cards && (
              <div
                className={`grid grid-cols-1 ${section.cards.length === 2 ? "md:grid-cols-2" : section.cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6 mb-8`}
              >
                {section.cards.map((card) => {
                  const CardIcon = card.icon ? iconMap[card.icon] : null
                  return (
                    <div key={card.title} className="bg-light-mint-gray p-6 rounded-xl">
                      {CardIcon && (
                        <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center mb-4">
                          <CardIcon className="text-white w-5 h-5" />
                        </div>
                      )}
                      <h4 className="font-semibold text-steel-blue mb-3">{card.title}</h4>
                      {card.text && <p className="text-sm text-gray-700 mb-3">{card.text}</p>}
                      {card.items && (
                        <ul className="text-sm text-gray-700 space-y-2">
                          {card.items.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {section.pricing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {section.pricing.map((price) => (
                    <div key={price.label} className="text-center">
                      <div className="text-3xl font-bold text-steel-blue mb-2">{price.value}</div>
                      <div className="text-sm text-gray-700">{price.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{price.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section.steps && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {section.steps.map((step) => (
                  <div key={step.title} className="text-center bg-light-mint-gray p-4 rounded-xl">
                    <div className="w-12 h-12 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                    <h4 className="font-semibold text-steel-blue mb-2">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            )}

            {section.paymentOptions && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {section.paymentOptions.map((option) => (
                    <div key={option.title}>
                      <h4 className="font-semibold text-green-800 mb-3">{option.title}</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {option.items.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section.cookieTypes && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {section.cookieTypes.map((cookie) => {
                  const CookieIcon = iconMap[cookie.icon]
                  return (
                    <div key={cookie.title} className="bg-light-mint-gray p-4 rounded-xl text-center">
                      {CookieIcon && (
                        <div className="w-12 h-12 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-3">
                          <CookieIcon className="text-white w-6 h-6" />
                        </div>
                      )}
                      <h4 className="font-semibold text-steel-blue mb-2">{cookie.title}</h4>
                      <p className="text-xs text-gray-600">{cookie.description}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {section.managementOptions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-yellow-800 mb-3">Managing Your Cookie Preferences</h4>
                <p className="text-yellow-700 text-sm mb-4">
                  You can control and manage cookies in various ways. Please note that removing or blocking cookies may
                  impact your user experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {section.managementOptions.map((option) => (
                    <div key={option.title} className="bg-white p-4 rounded-lg">
                      <h5 className="font-semibold text-steel-blue mb-2">{option.title}</h5>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {section.deviceClasses && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {section.deviceClasses.map((deviceClass) => (
                  <div key={deviceClass.class} className="bg-light-mint-gray p-6 rounded-xl">
                    <h4 className="font-semibold text-steel-blue mb-4">{deviceClass.class}</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      {deviceClass.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {section.certifications && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {section.certifications.map((cert) => {
                  const CertIcon = iconMap[cert.icon]
                  return (
                    <div key={cert.title} className="bg-light-mint-gray p-6 rounded-xl text-center">
                      {CertIcon && (
                        <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
                          <CertIcon className="text-white w-8 h-8" />
                        </div>
                      )}
                      <h4 className="font-semibold text-steel-blue mb-2">{cert.title}</h4>
                      <p className="text-xs text-gray-600 mb-3">{cert.description}</p>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{cert.status}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {section.securityStandards && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {section.securityStandards.map((standard) => (
                  <div key={standard.title} className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-semibold text-steel-blue mb-4">{standard.title}</h4>
                    <ul className="text-sm text-gray-700 space-y-2">
                      {standard.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {section.reports && (
              <div className="space-y-4">
                {section.reports.map((report) => (
                  <div
                    key={report.title}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center">
                          <FileText className="text-white w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-steel-blue mb-1">{report.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Report Period: {report.period}</span>
                            <span>•</span>
                            <span>Auditor: {report.auditor}</span>
                            <span>•</span>
                            <span>Status: {report.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          className="bg-light-mint-gray text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-80 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm font-medium"
                        >
                          <Download className="w-4 h-4 inline mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default DocumentSection
