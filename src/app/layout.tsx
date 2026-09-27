import type { Metadata } from "next"
import { Manrope, Sora } from "next/font/google"
import { cookies } from "next/headers"
import { Toaster } from "sonner"
import "./globals.css"
import AuthHydration from "@/components/auth/AuthHydration"
import ConditionalFooter from "@/components/layout/ConditionalFooter"
import ConditionalNavbar from "@/components/layout/ConditionalNavbar"
import QueryProvider from "@/components/providers/QueryProvider"
import { StripeConfigProvider } from "@/components/providers/StripeConfigProvider"
import ThemeProvider from "@/components/theme/ThemeProvider"
import { buildNavbarInitialAuthState } from "./layout-auth-state"

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
  // Read auth cookie for SSR - see `buildNavbarInitialAuthState` for what gets kept.
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth-storage")
  const initialState = buildNavbarInitialAuthState(authCookie?.value)

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${sora.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <StripeConfigProvider publishableKey={stripePublishableKey}>
            <QueryProvider>
              {/* Must stay the first sibling so its restore effect runs before any page effect reads the auth store. */}
              <AuthHydration />
              <ConditionalNavbar initialAuthState={initialState} />
              {children}
              <ConditionalFooter />
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </StripeConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
