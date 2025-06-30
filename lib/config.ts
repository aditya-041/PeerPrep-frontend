// Configuration for API endpoints
export const config = {
  // Backend API URL - will use environment variable in production
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",

  // Socket.IO URL - same as API URL
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",

  // Check if backend is ready
  BACKEND_READY: process.env.NEXT_PUBLIC_BACKEND_READY === "true",

  // Environment check
  IS_PRODUCTION: process.env.NODE_ENV === "production",
}

// Helper function to check backend health
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${config.API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    return response.ok
  } catch (error) {
    console.warn("Backend health check failed:", error)
    return false
  }
}
