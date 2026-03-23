# TypeScript Best Practices - Complete Guide for AI Agents

> This document is designed for AI agents and LLMs to follow when writing, reviewing, or refactoring TypeScript code.

## When to Apply This Skill

Apply these rules when:
- Writing new TypeScript code (.ts, .tsx files)
- Reviewing TypeScript code for improvements
- Converting JavaScript to TypeScript
- Fixing type errors or type inference issues
- Creating type definitions
- Working with generics and utility types

---

## CRITICAL RULES (Always Follow)

### Rule 1: Never Use `any`

The `any` type defeats the purpose of TypeScript. It disables type checking entirely.

**INCORRECT:**
```typescript
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

const result: any = await fetchUser();
```

**CORRECT:**
```typescript
interface DataItem {
  value: string;
}

function processData(data: DataItem[]): string[] {
  return data.map((item) => item.value);
}

const result: User | null = await fetchUser();
```

**Alternatives to `any`:**
- `unknown` - for truly unknown types (requires type narrowing)
- `never` - for impossible states
- Generic `<T>` - for flexible, reusable types
- Union types - for multiple specific possibilities

---

### Rule 2: Enable Strict Mode

Always configure TypeScript with strict mode enabled. This catches many bugs at compile time.

**Required tsconfig.json settings:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

### Rule 3: Use Type Guards for Runtime Type Checking

Type guards allow TypeScript to narrow types based on runtime checks.

**Custom type guard pattern:**
```typescript
// Define the type
interface User {
  id: string;
  name: string;
  email: string;
}

// Create a type guard
function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string'
  );
}

// Usage
function handleData(data: unknown) {
  if (isUser(data)) {
    // TypeScript knows `data` is User here
    console.log(data.email);
  }
}
```

**Built-in type guards:**
```typescript
// typeof
if (typeof value === 'string') { /* value is string */ }

// instanceof
if (error instanceof Error) { /* error is Error */ }

// in operator
if ('email' in user) { /* user has email property */ }

// Array.isArray
if (Array.isArray(items)) { /* items is array */ }
```

---

### Rule 4: Interface vs Type - When to Use Each

**Use `interface` for:**
- Object shapes and structures
- Classes that will be extended
- Declaration merging needs

```typescript
interface User {
  id: string;
  name: string;
}

interface Admin extends User {
  permissions: string[];
}

// Declaration merging
interface User {
  createdAt: Date;
}
// Now User has id, name, and createdAt
```

**Use `type` for:**
- Union types
- Intersection types
- Tuple types
- Mapped types
- Complex type transformations

```typescript
// Union types
type Status = 'pending' | 'active' | 'inactive';

// Intersection types
type AdminUser = User & { permissions: string[] };

// Tuple types
type Coordinate = [number, number];

// Mapped types
type Optional<T> = { [K in keyof T]?: T[K] };

// Complex types
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error };
```

---

### Rule 5: Proper Generic Usage

Generics enable reusable, type-safe code.

**Basic generic function:**
```typescript
function identity<T>(value: T): T {
  return value;
}

const num = identity(42);        // type is number
const str = identity('hello');   // type is string
```

**Generic with constraints:**
```typescript
// T must have a length property
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

getLength('hello');     // OK
getLength([1, 2, 3]);   // OK
getLength(123);         // Error: number has no length
```

**Generic with keyof:**
```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'John', age: 30 };
const name = getProperty(user, 'name');  // type is string
const age = getProperty(user, 'age');    // type is number
```

**Generic interfaces:**
```typescript
interface Repository<T> {
  find(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

class UserRepository implements Repository<User> {
  // Implementation
}
```

---

### Rule 6: Utility Types - Master These

TypeScript provides powerful built-in utility types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Partial<T> - All properties optional
type UserUpdate = Partial<User>;
// { id?: string; name?: string; ... }

// Required<T> - All properties required
type RequiredUser = Required<Partial<User>>;

// Readonly<T> - All properties readonly
type ImmutableUser = Readonly<User>;

// Pick<T, K> - Select specific properties
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: string; name: string }

// Omit<T, K> - Exclude specific properties
type PublicUser = Omit<User, 'password'>;
// { id: string; name: string; email: string; createdAt: Date }

// Record<K, T> - Create object type with keys K and values T
type UserRoles = Record<string, 'admin' | 'user' | 'guest'>;

// Exclude<T, U> - Exclude types from union
type NonNullStatus = Exclude<Status | null, null>;

// Extract<T, U> - Extract types from union
type ActiveStatuses = Extract<Status, 'active' | 'pending'>;

// NonNullable<T> - Remove null and undefined
type ValidUser = NonNullable<User | null | undefined>;

// ReturnType<T> - Get return type of function
type FetchResult = ReturnType<typeof fetchUser>;

// Parameters<T> - Get parameter types of function
type FetchParams = Parameters<typeof fetchUser>;
```

---

### Rule 7: Type-Safe Error Handling

**Result/Either pattern:**
```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return { ok: false, error: new Error(`HTTP ${response.status}`) };
    }
    const user = await response.json();
    return { ok: true, value: user };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// Usage
const result = await fetchUser('123');
if (result.ok) {
  console.log(result.value.name); // TypeScript knows value exists
} else {
  console.error(result.error.message); // TypeScript knows error exists
}
```

**Custom error classes:**
```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, 'NOT_FOUND', 404);
  }

  static unauthorized(): AppError {
    return new AppError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 'BAD_REQUEST', 400);
  }
}
```

---

### Rule 8: Discriminated Unions for State Management

Use a common "discriminant" property to create type-safe state machines:

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case 'idle':
      return 'Ready to load';
    case 'loading':
      return 'Loading...';
    case 'success':
      // TypeScript knows `data` exists here
      return `Loaded: ${JSON.stringify(state.data)}`;
    case 'error':
      // TypeScript knows `error` exists here
      return `Error: ${state.error.message}`;
  }
}
```

**More complex example - Form state:**
```typescript
type FormState =
  | { step: 'info'; data: { name: string; email: string } }
  | { step: 'preferences'; data: { theme: 'light' | 'dark'; notifications: boolean } }
  | { step: 'review'; allData: UserFormData }
  | { step: 'submitted'; confirmationId: string };
```

---

### Rule 9: Const Assertions

Use `as const` to create literal types and readonly arrays:

```typescript
// Without as const
const config = {
  endpoint: '/api',
  timeout: 5000
};
// Type: { endpoint: string; timeout: number }

// With as const
const config = {
  endpoint: '/api',
  timeout: 5000
} as const;
// Type: { readonly endpoint: '/api'; readonly timeout: 5000 }

// Array example
const statuses = ['pending', 'active', 'inactive'] as const;
type Status = typeof statuses[number];
// Type: 'pending' | 'active' | 'inactive'
```

---

### Rule 10: Proper Null Handling

**Use nullish coalescing and optional chaining:**
```typescript
// Optional chaining
const email = user?.profile?.email;

// Nullish coalescing (only for null/undefined)
const name = user.name ?? 'Anonymous';

// Combining both
const displayName = user?.profile?.displayName ?? user?.name ?? 'Guest';
```

**Avoid non-null assertion (!):**
```typescript
// BAD - This can cause runtime errors
const email = user!.email;

// GOOD - Handle null properly
const email = user?.email;
if (!email) {
  throw new Error('Email is required');
}
// Now TypeScript knows email is string
```

---

## NAMING CONVENTIONS

| Element | Convention | Example |
|---------|------------|---------|
| Interface | PascalCase | `UserProfile`, `ApiResponse` |
| Type alias | PascalCase | `RequestConfig`, `AsyncState` |
| Enum | PascalCase | `HttpStatus`, `UserRole` |
| Enum member | PascalCase or UPPER_SNAKE | `Success`, `HTTP_OK` |
| Generic parameter | T prefix or single letter | `T`, `TData`, `K`, `V` |
| Function | camelCase | `getUserById`, `validateEmail` |
| Variable | camelCase | `userList`, `isActive` |
| Constant | UPPER_SNAKE or camelCase | `MAX_RETRIES`, `apiEndpoint` |
| Private property | prefix with _ or # | `_cache`, `#internalState` |
| Boolean | prefix with is/has/can/should | `isActive`, `hasPermission` |

---

## ANTI-PATTERNS TO AVOID

1. **Using `any` as an escape hatch**
   - Use `unknown` and narrow the type instead

2. **Using `@ts-ignore` or `@ts-expect-error`**
   - Fix the actual type error

3. **Non-null assertion operator (!)**
   - Check for null properly

4. **Type assertions without validation**
   - Use type guards instead of `as Type`

5. **Overusing `as` for casting**
   - Prefer type guards and proper type inference

6. **Using `Function` type**
   - Use specific function signatures: `(arg: Type) => ReturnType`

7. **Mutable exports**
   - Use `readonly` and `as const`

8. **Implicit any in callbacks**
   - Always type callback parameters

---

## QUICK REFERENCE

### Type Narrowing Techniques
```typescript
// typeof
typeof x === 'string'

// instanceof
x instanceof Error

// in operator
'property' in object

// Custom type guard
function isType(x: unknown): x is MyType

// Truthiness
if (x) { /* x is truthy */ }

// Equality
if (x === 'value') { /* x is 'value' */ }
```

### Common Patterns
```typescript
// Optional parameter
function greet(name?: string) {}

// Default parameter
function greet(name = 'World') {}

// Rest parameters
function sum(...numbers: number[]) {}

// Overloads
function parse(input: string): string;
function parse(input: number): number;
function parse(input: string | number) {}

// Assertion function
function assertDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) throw new Error('Value is undefined');
}
```

---

*This skill was created by CodeLab614. For more skills, visit the [agent-skills repository](https://github.com/CodeLab614/agent-skills).*
