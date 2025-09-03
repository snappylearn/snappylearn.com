import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  profileImageUrl?: string | null
  role: string
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>
  signUp: (email: string, password: string) => Promise<{ error: { message: string } | null }>
  signOut: () => Promise<void>
  updateUser: (updatedUser: User) => void
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is admin
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin')
  
  // Check if user is authenticated
  const isAuthenticated = !!user

  useEffect(() => {
    // Check for stored JWT token
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          console.log('No stored token found');
          setLoading(false);
          return;
        }

        console.log('Found stored token, validating...');
        
        // Validate token with backend
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('Token valid, user restored:', userData.email);
          setUser(userData);
        } else {
          console.log('Token invalid, clearing...');
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Session check error:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.error || 'Login failed' } };
      }

      if (data.token && data.user) {
        // Store JWT token
        localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        console.log('Login successful:', data.user.email);
        return { error: null };
      }

      return { error: { message: 'Login failed' } };
    } catch (error) {
      return { error: { message: 'Network error occurred' } };
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.error || 'Signup failed' } };
      }

      console.log('Signup successful:', data.message);
      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error occurred' } };
    }
  }

  const signOut = async () => {
    try {
      // Call backend signout endpoint (optional)
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (error) {
      console.log('Signout endpoint error:', error);
    } finally {
      // Clear token and user state
      localStorage.removeItem('auth_token');
      setUser(null);
      console.log('Signed out successfully');
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, updateUser, loading, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}