import { useAuthStore } from "@/stores/authStore"

/**
 * Checks for 401 or 403 errors in API responses
 * If unauthorized error exists, automatically logs out and redirects to login page
 */
export async function handleApiError(response: Response, router?: { push: (path: string) => void }): Promise<void> {
  if (response.status === 401 || response.status === 403) {
    const { logout } = useAuthStore.getState()
    await logout()
    
    if (router) {
      router.push("/login")
    } else if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    
    throw new Error("Unauthorized: Session expired or access denied")
  }
  
  if (!response.ok) {
    // We're trying to read the response without cloning it, so we only check the status
    // The caller can call response.json() for detailed error message
    throw new Error(`Request failed with status ${response.status}`)
  }
}

