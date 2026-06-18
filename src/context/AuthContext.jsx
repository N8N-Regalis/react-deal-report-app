import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const ALLOWED_DOMAIN = 'regaliscapital.com'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('auth_user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      // Validate domain on load
      if (parsedUser.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        setUser(parsedUser)
      } else {
        localStorage.removeItem('auth_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    // Validate domain before allowing login
    if (!userData.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
      throw new Error(`Access restricted to @${ALLOWED_DOMAIN} email addresses only`)
    }
    setUser(userData)
    localStorage.setItem('auth_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    // Also clear Google token if using GIS
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
  }

  const isAuthenticated = user !== null
  const isAuthorized = user?.email?.endsWith(`@${ALLOWED_DOMAIN}`)

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
