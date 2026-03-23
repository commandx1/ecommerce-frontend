---
name: page-layout
description: Structure Next.js App Router pages using layout.tsx, nested layouts, and slot-based composition — never build layout logic inside page components
---

# Workflow

## 1. Decide which layout level owns the UI

Before writing any file, map the route to its layout level:

```
app/
├── layout.tsx                  → global shell (html, body, font, global providers)
├── (auth)/
│   ├── layout.tsx              → auth shell (centered card, no sidebar)
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx              → dashboard shell (sidebar + topbar)
│   ├── claims/page.tsx
│   └── settings/page.tsx
└── page.tsx                    → public landing
```

Rules:

- `app/layout.tsx` → only html/body wrapper, global font, global providers (Toaster, QueryClient, etc.)
- Route group `layout.tsx` → shared chrome for that section (sidebar, topbar, auth guard)
- `page.tsx` → page-specific content only, zero layout chrome

Never put sidebar or topbar JSX inside `page.tsx`. If you find yourself doing that, move it to the nearest `layout.tsx`.

## 2. Global layout (app/layout.tsx)

Only things that apply to every single page go here. Nothing else.

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/Toaster"
import { Providers } from "./Providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: { template: "%s | DentyPro", default: "DentyPro" },
  description: "...",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

Rules:

- Font definition lives here — never in individual pages
- `<Toaster />` and other global overlays live here
- Client providers (QueryClientProvider, zustand hydration) go into `Providers.tsx`, not inline

## 3. Providers.tsx — isolate "use client" from the root layout

Root layout must stay a server component. Move all client-side providers to a dedicated file:

```tsx
// app/Providers.tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

## 4. Dashboard layout (route group)

Use route groups `(groupName)` to share layout between related pages without affecting the URL.

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { AuthGuard } from "@/components/auth/AuthGuard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-light-mint-gray">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
```

Rules:

- `AuthGuard` wraps at layout level, never inside individual pages
- `<main>` owns the scroll container — individual pages must not set `overflow-y-auto` themselves
- Sidebar and Topbar are imported from `components/layout/`, not defined inline

## 5. Page component structure

A page component is layout-agnostic. It only owns its content.

```tsx
// app/(dashboard)/claims/page.tsx
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClaimsTable } from "@/features/claims/components/ClaimsTable"
import { ClaimsTableSkeleton } from "@/features/claims/components/ClaimsTableSkeleton"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Claims" }

export default function ClaimsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Claims" description="Manage and track insurance claims" />
      <Suspense fallback={<ClaimsTableSkeleton />}>
        <ClaimsTable />
      </Suspense>
    </div>
  )
}
```

Rules:

- Page wrapper div: always `p-6 space-y-6` (or match project spacing convention)
- `metadata` export on every page — never skip
- Page never imports Sidebar, Topbar, or any chrome components
- Suspense boundaries live in the page, not in layout

## 6. PageHeader component

Every page gets a consistent header. Use a shared component — never hardcode h1 + p inline per page.

```tsx
// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-2xl font-bold text-steel-blue">{title}</h1>
      {description && <p className="text-gray-500 mt-1 text-sm">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
)
```

Usage with actions:

```tsx
<PageHeader title="Claims" actions={<button onClick={handleExport}>Export</button>} />
```

## 7. Auth layout (centered, no sidebar)

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-light-mint-gray flex items-center justify-center">{children}</div>
}
```

The login/register page renders as `children` — it only contains the card, not the centering wrapper.

## 8. Folder structure

```
app/
├── layout.tsx                        → global shell
├── Providers.tsx                     → client providers
├── globals.css
├── page.tsx                          → public landing
├── (auth)/
│   ├── layout.tsx                    → centered wrapper
│   ├── login/page.tsx
│   └── register/page.tsx
└── (dashboard)/
    ├── layout.tsx                    → sidebar + topbar + auth guard
    ├── claims/page.tsx
    ├── settings/page.tsx
    └── ...

components/layout/
├── Sidebar.tsx
├── Topbar.tsx
└── PageHeader.tsx
```

## 9. Checklist

- [ ] `app/layout.tsx` only has html/body, font, global providers — nothing else
- [ ] Client providers are in `Providers.tsx`, not inline in root layout
- [ ] Route groups used to share layout without affecting URLs
- [ ] Auth guard is in layout, never in individual pages
- [ ] `<main>` scroll container is owned by layout, not by pages
- [ ] Every page exports `metadata`
- [ ] Pages never import Sidebar, Topbar, or layout chrome
- [ ] `PageHeader` component used consistently — no inline h1+p per page
- [ ] Suspense boundaries are in page.tsx, not in layout.tsx
