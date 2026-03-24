---
name: api-integration
description: Integrate a REST API endpoint with typed request/response, axios, and proper error handling
---

# Workflow

## 1. Define request and response types

```ts
// features/auth/types.ts
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
  }
}
```

## 2. Use the shared axios instance

Never create a new axios instance inside a service. Use the project's shared instance:

```ts
import { apiClient } from "@/lib/apiClient" // project-wide axios instance with interceptors
```

If `apiClient` doesn't exist yet, create it once at `lib/apiClient.ts`:

```ts
import axios from "axios"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

## 3. Create the service function

```ts
// features/auth/authService.ts
import { apiClient } from "@/lib/apiClient"
import type { LoginRequest, LoginResponse } from "./types"

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout")
  },
}
```

## 4. Error handling rules

- Never catch errors inside the service → let them bubble up to the hook or handler
- Catch in the hook or submit handler, then call `showToast.error()`
- For typed error responses, use a type guard:

```ts
import axios from "axios"

// In the hook:
try {
  await authService.login(formData)
} catch (err) {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message ?? "An error occurred"
    showToast.error("Login failed", message)
  }
}
```

## 5. Checklist

- [ ] Request and response types defined, no `any`
- [ ] Shared `apiClient` used, not a local axios instance
- [ ] Service functions are pure async functions, no state
- [ ] Errors bubble up from service, caught in hook/handler
- [ ] `showToast.error()` used for user-facing errors, not inline rendering
- [ ] Service is exported as an object (`authService.login`, not standalone functions)
