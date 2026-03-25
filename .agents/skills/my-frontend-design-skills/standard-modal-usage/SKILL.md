---
name: standard-modal-usage
description: Ensure that all modals in the project use the reusable Modal component instead of inline div implementations
---

# Workflow

1. **Find all inline modal implementations**
   - Look for `<div>` structures with show/hide state that behave like modals
   - Look for conditional rendering patterns like `{isOpen && <div>...</div>}`

2. **Replace with reusable Modal component**
   - Use the project’s predefined `Modal` component
   - Pass content via children or props
   - Pass open/close state as props or via custom hook

3. **Ensure state handling**
   - Local state (`useState`) can control modal visibility
   - Shared/global state via Zustand if modal visibility needs to be accessible across components

4. **Preserve layout and styling**
   - Ensure replacing inline modal doesn’t break UI
   - Apply consistent props like width, title, buttons according to design

5. **TypeScript compliance**
   - Ensure all props and types are correct
   - No `any` type allowed

6. **Remove all inline modal code**
   - Delete old `<div>` modal implementations after replacement
   - Ensure all modals use reusable component
