"use client"

import { Download, FileText } from "lucide-react"
import type {
  LegalCertification,
  LegalCookieType,
  LegalDeviceClass,
  LegalManagementOption,
  LegalPaymentOption,
  LegalPricingItem,
  LegalReport,
  LegalSection,
  LegalSectionCard,
  LegalSecurityStandard,
  LegalStepItem,
} from "../../types"
import { iconMap } from "./documentIcons"

interface DocumentSectionContentProps {
  section: LegalSection
}

const SectionList = ({ items }: { items: string[] }) => {
  return (
    <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2 ml-4">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

const SectionWarningItems = ({ items }: { items: string[] }) => {
  const midpoint = Math.ceil(items.length / 2)
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <h4 className="font-semibold text-red-800 mb-3">You may not use our Service:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ul className="text-sm text-red-700 space-y-2">
          {items.slice(0, midpoint).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        <ul className="text-sm text-red-700 space-y-2">
          {items.slice(midpoint).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SectionItems = ({ items }: { items: string[] }) => {
  return (
    <ul className="text-gray-700 mb-6 space-y-2">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  )
}

const SectionCards = ({ cards }: { cards: LegalSectionCard[] }) => {
  const gridClassName = cards.length === 2 ? "md:grid-cols-2" : cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"

  return (
    <div className={`grid grid-cols-1 ${gridClassName} gap-6 mb-8`}>
      {cards.map((card) => {
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
  )
}

const SectionPricing = ({ pricing }: { pricing: LegalPricingItem[] }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricing.map((price) => (
          <div key={price.label} className="text-center">
            <div className="text-3xl font-bold text-steel-blue mb-2">{price.value}</div>
            <div className="text-sm text-gray-700">{price.label}</div>
            <div className="text-xs text-gray-500 mt-1">{price.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SectionSteps = ({ steps }: { steps: LegalStepItem[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {steps.map((step) => (
        <div key={step.title} className="text-center bg-light-mint-gray p-4 rounded-xl">
          <div className="w-12 h-12 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold">{step.step}</span>
          </div>
          <h4 className="font-semibold text-steel-blue mb-2">{step.title}</h4>
          <p className="text-sm text-gray-600">{step.description}</p>
        </div>
      ))}
    </div>
  )
}

const SectionPaymentOptions = ({ options }: { options: LegalPaymentOption[] }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => (
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
  )
}

const SectionCookieTypes = ({ cookies }: { cookies: LegalCookieType[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cookies.map((cookie) => {
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
  )
}

const SectionManagementOptions = ({ options }: { options: LegalManagementOption[] }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h4 className="font-semibold text-yellow-800 mb-3">Managing Your Cookie Preferences</h4>
      <p className="text-yellow-700 text-sm mb-4">
        You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact
        your user experience.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => (
          <div key={option.title} className="bg-white p-4 rounded-lg">
            <h5 className="font-semibold text-steel-blue mb-2">{option.title}</h5>
            <p className="text-xs text-gray-600">{option.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const SectionDeviceClasses = ({ deviceClasses }: { deviceClasses: LegalDeviceClass[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {deviceClasses.map((deviceClass) => (
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
  )
}

const SectionCertifications = ({ certifications }: { certifications: LegalCertification[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {certifications.map((cert) => {
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
  )
}

const SectionSecurityStandards = ({ standards }: { standards: LegalSecurityStandard[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {standards.map((standard) => (
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
  )
}

const SectionReports = ({ reports }: { reports: LegalReport[] }) => {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.title} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
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
  )
}

const DocumentSectionContent = ({ section }: DocumentSectionContentProps) => {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-steel-blue mb-4">{section.title}</h3>
      {section.content && <p className="text-gray-700 mb-6 leading-relaxed">{section.content}</p>}
      {section.list && <SectionList items={section.list} />}
      {section.items && section.warning && <SectionWarningItems items={section.items} />}
      {section.items && !section.warning && <SectionItems items={section.items} />}
      {section.cards && <SectionCards cards={section.cards} />}
      {section.pricing && <SectionPricing pricing={section.pricing} />}
      {section.steps && <SectionSteps steps={section.steps} />}
      {section.paymentOptions && <SectionPaymentOptions options={section.paymentOptions} />}
      {section.cookieTypes && <SectionCookieTypes cookies={section.cookieTypes} />}
      {section.managementOptions && <SectionManagementOptions options={section.managementOptions} />}
      {section.deviceClasses && <SectionDeviceClasses deviceClasses={section.deviceClasses} />}
      {section.certifications && <SectionCertifications certifications={section.certifications} />}
      {section.securityStandards && <SectionSecurityStandards standards={section.securityStandards} />}
      {section.reports && <SectionReports reports={section.reports} />}
    </div>
  )
}

export default DocumentSectionContent
