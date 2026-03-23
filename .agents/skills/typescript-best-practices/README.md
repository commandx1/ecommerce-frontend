# TypeScript Best Practices

A comprehensive skill for writing clean, maintainable, and type-safe TypeScript code.

## Installation

```bash
npx skills add https://github.com/CodeLab614/agent-skills --skill typescript-best-practices
```

## What's Included

This skill covers:

- **Strict Typing**: Avoid `any`, use proper types
- **Type Guards**: Runtime type checking patterns
- **Generics**: Reusable, type-safe abstractions
- **Error Handling**: Type-safe error patterns
- **Naming Conventions**: Consistent naming standards
- **Utility Types**: Built-in TypeScript helpers
- **Best Patterns**: Common TypeScript idioms

## Rules Overview

| Category | Rules |
|----------|-------|
| Type Safety | 5 rules |
| Error Handling | 3 rules |
| Generics | 4 rules |
| Patterns | 5 rules |

## Usage

Once installed, this skill will automatically activate when you're working with TypeScript files and will guide you to write better, more type-safe code.

## Examples

### Before (Bad)
```typescript
function getData(id: any): any {
  // ...
}
```

### After (Good)
```typescript
function getData<T>(id: string): Promise<T | null> {
  // ...
}
```

## Author

CodeLab614
