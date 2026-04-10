import type { Metadata } from "next"
import { Fraunces, Manrope } from "next/font/google"
import { cookies } from "next/headers"
import { Toaster } from "sonner"
import "./globals.css"
import AuthHydration from "@/components/auth/AuthHydration"
import ConditionalFooter from "@/components/layout/ConditionalFooter"
import ConditionalNavbar from "@/components/layout/ConditionalNavbar"
import ThemeProvider from "@/components/theme/ThemeProvider"

const manrope = Manrope({
  variable: "--font-denty-sans",
  subsets: ["latin"],
})

const fraunces = Fraunces({
  variable: "--font-denty-display",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Dentypro - Dental Supplies",
  description: "Dentypro - Dental Supplies",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Read auth cookie for SSR
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth-storage")
  let initialState = null

  if (authCookie) {
    try {
      let parsed = null
      try {
        parsed = JSON.parse(authCookie.value)
      } catch {
        const decodedValue = decodeURIComponent(authCookie.value)
        parsed = JSON.parse(decodedValue)
      }
      initialState = parsed?.state || null
    } catch {
      // Ignore parsing errors
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${fraunces.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthHydration />
          <ConditionalNavbar initialAuthState={initialState} />
          {children}
          <ConditionalFooter />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
