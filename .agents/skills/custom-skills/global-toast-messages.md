---
name: global-toast-messages
description: Ensure all messages in the project (error, success, warning, info, love, loading) are shown using the reusable Toast component and showToast helper instead of inline rendering
---

# Workflow

1. **Find all inline or ad-hoc message rendering**
   - Look for `<p>{error}</p>`, `{message && ...}`, alerts, divs used for messages
   - Include validation errors, API response errors, modal messages, or any component-level messages

2. **Replace with showToast**
   - Use the `showToast` helper object with the appropriate type:
     - `showToast.error(title, message)`
     - `showToast.success(title, message)`
     - `showToast.warning(title, message)`
     - `showToast.info(title, message)`
     - `showToast.love(title, message)`
     - `showToast.loading(title, message)`
   - Ensure title and message are provided
   - Remove all inline rendering of messages after replacement

3. **Preserve component structure and local state**
   - Do not alter component layout
   - Keep `useState` or local state unrelated to message handling intact

4. **API / hook errors**
   - Catch errors and call the correct `showToast` type
   - Example: API failure → `showToast.error("Login failed", err.message)`

5. **Validation messages**
   - Client-side validation messages → use `showToast.warning` or `showToast.error`
   - Do not render inline `<p>` for validation messages

6. **TypeScript compliance**
   - Ensure all calls to `showToast` respect the proper type signatures
   - Do not use `any` type

7. **Optional: consistency check**
   - Confirm that every message in the project now uses the reusable Toast component
   - Remove any leftover ad-hoc or inline message rendering

## Severity Guide

- API failure → error
- Validation (client-side) → warning
- 401/403 → error
- Empty required field → warning
- Success → success
