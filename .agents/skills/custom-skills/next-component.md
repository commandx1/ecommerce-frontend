---
name: next-component
description: Create a reusable Next.js component following best practices, using useState for local state and Zustand for shared/global state
---

# Workflow

1.  **Create functional component**
    - Use only functional components, no class components
    - Keep the component small and focused

2.  **Add TypeScript props interface**
    - Define all props with strict typing
    - Prefer `interface` for objects, `type` for unions

3.  **Handle state**

    ## useState vs Zustand — decision rule

    useState:
    - Component unmount edilince sıfırlanması gereken state
    - Sadece o component ve direkt child'ları kullanıyorsa
    - Form input, modal toggle, local loading state

    Zustand:
    - 2+ farklı component aynı state'e ihtiyaç duyuyorsa
    - Sayfa değişince kaybolmaması gereken state
    - Auth, tema, sepet, global loading

- Ensure no business logic resides in the UI component

4.  **Extract reusable logic**
    - If logic is repeated or complex, move it into a custom hook
    - Hooks should only manage local logic or connect to Zustand store

5.  **Follow component-based architecture**
    - Separate UI and logic
    - Avoid prop drilling; use context or Zustand for global state

6.  **Styling**
    - Add basic styling if needed
    - Keep styling reusable and modular

7.  **Testing**
    - Add unit tests for reusable logic and hooks
    - Ensure components behave correctly with both local and global state

8.  **Documentation / Comments**
    - Add concise comments explaining why Zustand or useState is used
    - Mention any dependencies between components and global stores
