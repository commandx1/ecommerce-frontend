import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  (config) => {
    let token: string | null = null

    if (typeof window !== "undefined") {
      // Try to get token from auth-storage cookie (Zustand persist)
      const name = "auth-storage="
      const decodedCookie = decodeURIComponent(document.cookie)
      const ca = decodedCookie.split(";")
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === " ") {
          c = c.substring(1)
        }
        if (c.indexOf(name) === 0) {
          try {
            const authData = JSON.parse(c.substring(name.length, c.length))
            token = authData.state?.accessToken || null
          } catch (e) {
            console.error("Error parsing auth-storage cookie", e)
          }
          break
        }
      }

      // Fallback to localStorage if cookie not found (for backward compatibility)
      if (!token) {
        token = localStorage.getItem("token")
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export default apiClient
