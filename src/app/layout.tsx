import type { Metadata } from "next"
import { Manrope, Sora } from "next/font/google"
import { cookies } from "next/headers"
import { Toaster } from "sonner"
import "./globals.css"
import AuthHydration from "@/components/auth/AuthHydration"
import ConditionalFooter from "@/components/layout/ConditionalFooter"
import ConditionalNavbar from "@/components/layout/ConditionalNavbar"
import QueryProvider from "@/components/providers/QueryProvider"
import ThemeProvider from "@/components/theme/ThemeProvider"

const manrope = Manrope({
  variable: "--font-denty-sans",
  subsets: ["latin"],
})

const sora = Sora({
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
      <body className={`${manrope.variable} ${sora.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <AuthHydration />
            <ConditionalNavbar initialAuthState={initialState} />
            {children}
            <ConditionalFooter />
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
