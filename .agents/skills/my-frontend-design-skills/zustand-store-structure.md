---
name: zustand-store-structure
description: Create and structure Zustand stores using the slice pattern — one store per domain, actions co-located with state, no business logic inside stores
---

# Workflow

## 1. Decide if Zustand is needed

Do NOT create a store for local state. Use `useState` instead.

| Situation                                              | Solution   |
| ------------------------------------------------------ | ---------- |
| Only one component uses this state                     | `useState` |
| State resets when component unmounts                   | `useState` |
| 2+ unrelated components share this state               | Zustand    |
| State must survive page navigation                     | Zustand    |
| State is: auth, theme, cart, notifications             | Zustand    |
| State is: modal open/close, input value, local loading | `useState` |

If you are unsure, start with `useState`. Migrate to Zustand only when a second component needs the same state.

## 2. One store per domain

Never put everything in a single global store. Each domain gets its own file.

```
store/
├── useAuthStore.ts
├── useClaimsStore.ts
├── useNotificationStore.ts
└── useUIStore.ts          → global UI-only state (sidebar open, theme)
```

Never create `useAppStore.ts` or `useGlobalStore.ts` — these become impossible to maintain.

## 3. Slice structure (single domain)

Every store file follows this exact structure: types → initial state → store → selectors.

```ts
// store/useClaimsStore.ts
import { create } from "zustand"

// 1. Types
interface Claim {
  id: string
  status: "pending" | "approved" | "denied"
  amount: number
}

interface ClaimsState {
  claims: Claim[]
  selectedClaimId: string | null
  isSubmitting: boolean
}

interface ClaimsActions {
  setSelectedClaim: (id: string | null) => void
  addClaim: (claim: Claim) => void
  updateClaimStatus: (id: string, status: Claim["status"]) => void
  reset: () => void
}

type ClaimsStore = ClaimsState & ClaimsActions

// 2. Initial state (extracted — used in reset)
const initialState: ClaimsState = {
  claims: [],
  selectedClaimId: null,
  isSubmitting: false,
}

// 3. Store
export const useClaimsStore = create<ClaimsStore>((set, get) => ({
  ...initialState,

  setSelectedClaim: (id) => set({ selectedClaimId: id }),

  addClaim: (claim) => set((state) => ({ claims: [...state.claims, claim] })),

  updateClaimStatus: (id, status) =>
    set((state) => ({
      claims: state.claims.map((c) => (c.id === id ? { ...c, status } : c)),
    })),

  reset: () => set(initialState),
}))

// 4. Selectors (exported separately — never inline in components)
export const selectClaims = (state: ClaimsStore) => state.claims
export const selectSelectedClaim = (state: ClaimsStore) =>
  state.claims.find((c) => c.id === state.selectedClaimId) ?? null
export const selectIsSubmitting = (state: ClaimsStore) => state.isSubmitting
```

## 4. Separate State and Actions types

Always define `State` and `Actions` as separate interfaces. This makes it clear what is data and what is behaviour.

```ts
// WRONG — everything in one interface
interface ClaimsStore {
  claims: Claim[]
  isSubmitting: boolean
  setSelectedClaim: (id: string | null) => void
  addClaim: (claim: Claim) => void
}

// CORRECT — split
interface ClaimsState { ... }
interface ClaimsActions { ... }
type ClaimsStore = ClaimsState & ClaimsActions
```

## 5. No business logic inside the store

Actions only update state. API calls, validation, and side effects belong in hooks or service layer.

```ts
// WRONG — API call inside store action
addClaim: async (claimData) => {
  const claim = await claimsService.create(claimData)   // ← never here
  set((state) => ({ claims: [...state.claims, claim] }))
},

// CORRECT — store action is pure state update
addClaim: (claim) =>
  set((state) => ({ claims: [...state.claims, claim] })),
```

```ts
// The API call lives in the hook
const useCreateClaim = () => {
  const addClaim = useClaimsStore((state) => state.addClaim)

  const createClaim = async (data: CreateClaimDTO) => {
    const claim = await claimsService.create(data) // ← API call here
    addClaim(claim) // ← then update store
  }

  return { createClaim }
}
```

## 6. Selectors — always use them, never destructure in components

```tsx
// WRONG — subscribes to the entire store, re-renders on any state change
const { claims, selectedClaimId, isSubmitting } = useClaimsStore()

// WRONG — inline selector defined inside component (new function ref on every render)
const claims = useClaimsStore((state) => state.claims)

// CORRECT — use exported selectors
import { useClaimsStore, selectClaims, selectSelectedClaim } from "@/store/useClaimsStore"

const claims = useClaimsStore(selectClaims)
const selectedClaim = useClaimsStore(selectSelectedClaim)
```

## 7. Always extract `initialState` for reset

Every store must have a `reset` action. This is critical for logout, page unmount cleanup, or test isolation.

```ts
const initialState: ClaimsState = {
  claims: [],
  selectedClaimId: null,
  isSubmitting: false,
}

export const useClaimsStore = create<ClaimsStore>((set) => ({
  ...initialState,
  // ...actions
  reset: () => set(initialState), // ← always present
}))
```

Call `reset` on logout:

```ts
// store/useAuthStore.ts
logout: () => {
  useClaimsStore.getState().reset()
  useNotificationStore.getState().reset()
  set(initialState)
}
```

## 8. Accessing store outside React (e.g. in services)

Use `.getState()` — never import the hook outside a component or custom hook.

```ts
// WRONG — hooks can only be called inside React components
const claims = useClaimsStore().claims // ← crashes outside component

// CORRECT — direct state access outside React
const claims = useClaimsStore.getState().claims
useClaimsStore.getState().addClaim(newClaim)
```

## 9. Persist store to localStorage (when needed)

Use `persist` middleware only for state that must survive a page refresh (e.g. auth token, theme, user preferences). Never persist large data lists.

```ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,
      setToken: (token) => set({ token }),
      logout: () => set(initialState),
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({ token: state.token }), // persist only token, not the whole store
    },
  ),
)
```

Rules:

- Never persist: lists, paginated data, form state, UI toggles
- Always persist: auth token, user preferences, theme
- Always use `partialize` to select only what needs persistence

## 10. Naming conventions

| What              | Convention                  | Example                               |
| ----------------- | --------------------------- | ------------------------------------- |
| Store hook        | `use` + Domain + `Store`    | `useClaimsStore`                      |
| State interface   | Domain + `State`            | `ClaimsState`                         |
| Actions interface | Domain + `Actions`          | `ClaimsActions`                       |
| Store type        | Domain + `Store`            | `ClaimsStore`                         |
| Selector          | `select` + What             | `selectClaims`, `selectSelectedClaim` |
| Store file        | `use` + Domain + `Store.ts` | `useClaimsStore.ts`                   |

## 11. Checklist

- [ ] `useState` considered first — Zustand only if state is truly shared
- [ ] One store file per domain — no global store
- [ ] `State` and `Actions` defined as separate interfaces
- [ ] `initialState` extracted as a const — `reset` action always present
- [ ] No API calls or business logic inside store actions
- [ ] Selectors exported separately — no inline selectors in components
- [ ] No destructuring of entire store in components
- [ ] `.getState()` used when accessing store outside React
- [ ] `persist` middleware only for data that survives refresh, with `partialize`
- [ ] Naming conventions followed
