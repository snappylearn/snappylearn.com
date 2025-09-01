import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Analytics } from '@/lib/analytics'

// Support both Supabase users and custom users
type User = SupabaseUser | {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  profileImageUrl?: string | null
  role?: string | null
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signInWithGoogle: (credential: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Check if user is admin
  const isAdmin = user && 'role' in user && (user.role === 'admin' || user.role === 'super_admin')

  useEffect(() => {
    // Check for Google OAuth tokens first
    const checkGoogleSession = async () => {
      const customAccessToken = localStorage.getItem('snappy_access_token');
      
      if (customAccessToken) {
        // For users who logged in with Google OAuth, validate the custom token
        try {
          const response = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${customAccessToken}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setLoading(false);
            return;
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('snappy_access_token');
            localStorage.removeItem('snappy_refresh_token');
          }
        } catch (error) {
          console.error('Error validating custom token:', error);
          localStorage.removeItem('snappy_access_token');
          localStorage.removeItem('snappy_refresh_token');
        }
      }
      
      // Fallback to Supabase session for traditional auth
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session);
      setUser(session?.user ?? null)
      setLoading(false)
    };
    
    checkGoogleSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session);
        const newUser = session?.user ?? null;
        setUser(newUser)
        setLoading(false)
        
        // Handle PostHog analytics for auth events
        if (event === 'SIGNED_IN' && newUser) {
          Analytics.identify(newUser.id, {
            email: newUser.email,
            created_at: newUser.created_at,
          });
          Analytics.trackSignIn('supabase', newUser.id);
          window.history.replaceState({}, '', '/');
        } else if (event === 'SIGNED_OUT') {
          Analytics.trackSignOut();
          Analytics.reset();
        }
      }
    )

    return () => subscription.unsubscribe()
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

      // Store tokens and user data directly
      if (data.access_token && data.user) {
        // Store custom tokens for API calls
        localStorage.setItem('snappy_access_token', data.access_token);
        localStorage.setItem('snappy_refresh_token', data.refresh_token);
        
        // Get complete user data from our backend
        try {
          const userResponse = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
            },
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
            console.log('User data loaded:', userData);
            
            // Force immediate redirect to dashboard
            setTimeout(() => {
              window.location.replace('/');
            }, 100);
          } else {
            // Fallback to basic user data from login response
            setUser(data.user);
            setTimeout(() => {
              window.location.replace('/');
            }, 100);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data from login response
          setUser(data.user);
          setTimeout(() => {
            window.location.replace('/');
          }, 100);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error occurred' } };
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      // Use custom signup endpoint that auto-confirms users
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

      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error occurred' } };
    }
  }

  const signInWithGoogle = async (credential: string) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { error: { message: data.error || 'Google sign-in failed' } };
      }

      // For existing users, our backend returns custom tokens and user data
      if (data.access_token && data.user) {
        // Store the custom tokens in localStorage for future API calls
        localStorage.setItem('snappy_access_token', data.access_token);
        localStorage.setItem('snappy_refresh_token', data.refresh_token);
        
        // Set user state directly from our backend response
        setUser(data.user);
        
        // Track analytics for Google sign-in
        Analytics.identify(data.user.id, {
          email: data.user.email,
          name: data.user.firstName && data.user.lastName ? `${data.user.firstName} ${data.user.lastName}` : data.user.email,
        });
        Analytics.trackSignIn('google', data.user.id);
        
        console.log('Google sign-in successful for existing user:', data.user);
        
        // Force immediate redirect to dashboard
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      } else {
        // For new users, handle Supabase session (if needed in future)
        console.log('Google sign-in response:', data);
      }

      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error occurred' } };
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signInWithGoogle, signOut, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}