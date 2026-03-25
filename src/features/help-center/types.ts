export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  subject: string
  message: string
  subscribe: boolean
}

export interface TicketFormData {
  priority: string
  category: string
  orderNumber: string
  title: string
  description: string
  urgentCallback: boolean
}

export interface SystemStatusItem {
  name: string
  status: string
  color: "green" | "yellow"
}

export interface SystemAnnouncementItem {
  type: string
  dotColor: string
  date: string
  title: string
  description: string
}
