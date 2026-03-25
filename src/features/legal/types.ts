export interface LegalNotice {
  type: "warning" | "success" | "info" | "error"
  title: string
  text: string
}

export interface LegalSectionCard {
  title: string
  icon?: string
  text?: string
  items?: string[]
}

export interface LegalPricingItem {
  value: string
  label: string
  note: string
}

export interface LegalStepItem {
  step: number
  title: string
  description: string
}

export interface LegalPaymentOption {
  title: string
  items: string[]
}

export interface LegalCookieType {
  title: string
  icon: string
  description: string
}

export interface LegalManagementOption {
  title: string
  description: string
}

export interface LegalDeviceClass {
  class: string
  items: string[]
}

export interface LegalCertification {
  title: string
  icon: string
  description: string
  status: string
}

export interface LegalSecurityStandard {
  title: string
  items: string[]
}

export interface LegalReport {
  title: string
  description: string
  period: string
  auditor: string
  status: string
}

export interface LegalSection {
  title: string
  content?: string
  list?: string[]
  items?: string[]
  cards?: LegalSectionCard[]
  warning?: boolean
  pricing?: LegalPricingItem[]
  steps?: LegalStepItem[]
  paymentOptions?: LegalPaymentOption[]
  cookieTypes?: LegalCookieType[]
  managementOptions?: LegalManagementOption[]
  deviceClasses?: LegalDeviceClass[]
  certifications?: LegalCertification[]
  securityStandards?: LegalSecurityStandard[]
  reports?: LegalReport[]
}

export interface LegalDocument {
  id: string
  title: string
  subtitle?: string
  lastUpdated?: string
  icon?: string
  notice?: LegalNotice
  sections?: LegalSection[]
}
