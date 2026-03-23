## Architecture

- Use component-based architecture
- Separate UI and logic (hooks)

## TypeScript

- Always use strict types
- Avoid any
- Use interfaces for API responses
- Prefer type inference when safe

## React / Next.js

- Use functional components only
- Extract reusable logic into hooks
- Keep components small and focused
- Avoid prop drilling → use context when needed

## Folder Structure

- /components → reusable UI
- /features → domain logic
- /hooks → custom hooks

## Rules

- No business logic inside UI components
- All API calls via service layer
