---
name: component-decomposition
description: Refactor a large component into properly decomposed child components following single responsibility principle
---

# Workflow

## 1. Analyze the component

Before writing any code, identify:

- How many distinct visual sections exist? (header, form, sidebar, list, etc.)
- Are there any repeated JSX structures that can be extracted to an array + map?
- Does the component mix layout with form logic or data fetching?
- Is the file longer than 80 lines of JSX?

## 2. Plan the split

Write out the component tree before coding:

```
ParentPage
├── ChildA        (what responsibility?)
├── ChildB
│   ├── SubChild1 (what responsibility?)
│   └── SubChild2
└── ChildC
```

## 3. Extract child components (bottom-up)

Start from the deepest/smallest pieces first:

- Field groups → e.g. `PersonalInfoFields`, `AddressSection`, `PasswordSection`
- Visual sections → e.g. `RegisterSidebar`, `RegisterHeader`
- Then compose them in the parent

Each child component must:

- Accept only the props it actually uses
- Have its own TypeScript props interface
- Be placed in `features/<feature>/components/`

## 4. Make the parent layout-only

After extraction, the parent should contain:

- No field rendering
- No repeated JSX blocks
- Only layout structure and child component composition

## 5. Replace repeated JSX with data arrays

Any structure repeated 2+ times → extract to a `const ITEMS = [...]` array and render with `.map()`.

## 6. Verify

- [ ] Parent component is layout-only
- [ ] Each child has a single clear responsibility
- [ ] No JSX block is repeated more than once
- [ ] All props are strictly typed
- [ ] Hooks are consumed in the closest appropriate parent
- [ ] Files are placed in the correct folder
