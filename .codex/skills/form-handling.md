---
name: form-handling
description: Create a reusable form with validation, extracted hook, and proper error display
---

# Workflow

## 1. Define types first

Create `types.ts` inside the feature folder:

```ts
export interface LoginFormData {
  email: string
  password: string
}

export type LoginFormErrors = Partial<Record<keyof LoginFormData | "submit", string>>
```

## 2. Create the custom hook

All form logic lives in the hook. The component gets only what it needs.

```ts
// hooks/useLoginForm.ts
export const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" })
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof LoginFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {}
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      await authService.login(formData)
      showToast.success("Welcome", "Login successful")
    } catch (err) {
      showToast.error("Login failed", (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return { formData, errors, isLoading, handleChange, handleSubmit }
}
```

## 3. Validation rules

- Use manual validation (as above) for simple forms
- Use Zod only if the form has 6+ fields or complex cross-field validation
- Never use Yup (not in the project stack)
- Clear field error on change (see handleChange above)

## 4. Error display

- Field-level errors → pass `error` prop to `TextField` / `SelectField`
- Submit errors → `showToast.error()`
- Never render `<p>{error}</p>` inline → always use TextField's error prop or showToast

## 5. Component structure

The form component receives everything from the hook and renders only UI:

```tsx
const LoginForm = () => {
  const { formData, errors, isLoading, handleChange, handleSubmit } = useLoginForm()

  return (
    <form onSubmit={handleSubmit}>
      <TextField name="email" value={formData.email} onChange={handleChange} error={errors.email} />
      <TextField name="password" value={formData.password} onChange={handleChange} error={errors.password} />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Loading..." : "Login"}
      </button>
    </form>
  )
}
```

## 6. Checklist

- [ ] Types defined in `types.ts`
- [ ] All logic in custom hook, zero logic in component
- [ ] Field errors cleared on change
- [ ] Submit errors use showToast, not inline rendering
- [ ] No `any` type used
- [ ] API call is in service layer, not in the hook directly
