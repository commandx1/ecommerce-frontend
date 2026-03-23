# AGENTS.md

## Component Decomposition Rules (STRICT)

Every component must follow the single responsibility principle.
A component is too large if ANY of the following is true:

- It has more than 80 lines of JSX
- It renders more than 2 distinct visual sections
- It imports more than 5 unrelated things
- It handles both layout AND form logic at the same time

When ANY of the above is true, you MUST split into child components.
Do not ask. Just split.

### How to split

1. Identify distinct visual or logical sections (header, form, sidebar, etc.)
2. Each section becomes its own component file
3. Group related fields into a sub-component (e.g. PersonalInfoFields, AddressSection)
4. The parent component becomes layout-only — no logic, no field rendering

### File placement

- Page entry point → `features/<feature>/FeaturePage.tsx`
- Child components → `features/<feature>/components/`
- Shared/reusable → `components/`

### Example: correct decomposition

WRONG — everything in one file:

```
RegisterPage (200 lines, header + form + sidebar + fields)
```

CORRECT:

```
RegisterPage.tsx          → layout only (<RegisterHeader />, <RegisterForm />, <RegisterSidebar />)
RegisterHeader.tsx        → logo + nav
RegisterForm.tsx          → form tag + useRegisterForm hook + child field sections
PersonalInfoFields.tsx    → name, email, phone, business type fields
AddressSection.tsx        → address autocomplete + address fields
PasswordSection.tsx       → password + confirm password
RegisterSidebar.tsx       → benefits list + stats
```

## Data-Driven Rendering

Never hardcode repeated JSX blocks. If the same structure repeats 2+ times, extract to an array and map.

WRONG:

```tsx
<div className="flex items-center text-white">
  <Icon1 /> <span>Benefit one</span>
</div>
<div className="flex items-center text-white">
  <Icon2 /> <span>Benefit two</span>
</div>
```

CORRECT:

```tsx
const BENEFITS = [
  { icon: Shield, label: "Benefit one" },
  { icon: Award, label: "Benefit two" },
]

{
  BENEFITS.map(({ icon: Icon, label }) => (
    <div key={label} className="flex items-center text-white">
      <Icon /> <span>{label}</span>
    </div>
  ))
}
```

## Hook Usage

- Business logic and form state → custom hook
- Hook is consumed by the closest parent that needs it, then props are drilled one level down
- Never pass hook internals more than 1 level deep → instead, pass only what the child needs

## TypeScript

- Always use strict types
- Avoid `any`
- Use `interface` for props and API responses
- Shared types for a feature → `features/<feature>/types.ts`

## Folder Structure

```
features/<feature>/
├── FeaturePage.tsx
├── components/
│   ├── ChildComponentA.tsx
│   └── ChildComponentB.tsx
├── hooks/
│   └── useFeatureForm.ts
└── types.ts

components/         → globally reusable UI (TextField, Modal, etc.)
hooks/              → globally reusable hooks
```

## Rules (Non-negotiable)

- No business logic inside UI components
- No inline modal implementations → use reusable Modal component
- No inline error/success messages → use showToast helper
- All API calls via service layer, never directly in components or hooks
- Imports order: React → Next.js → third-party → internal (absolute) → relative → types
