import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { SignUpForm } from './SignUpForm'
// import snappyLearnLogo from '@assets/snappylearn-logo-transparent.png'

interface AuthPageProps {
  embedded?: boolean;
}

export function AuthPage({ embedded = false }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false)

  if (embedded) {
    // Embedded version for landing page - no full page wrapper
    return (
      <div className="w-full space-y-6">
        {isSignUp ? (
          <SignUpForm onToggleMode={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onToggleMode={() => setIsSignUp(true)} />
        )}
      </div>
    )
  }

  // Full page version
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src="/snappylearn-logo-purple-owl.png" alt="SnappyLearn" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Chat Your Way to Knowledge.</h1>
          <p className="text-gray-600 mt-2">
            Learning is a conversation.
          </p>
        </div>

        {isSignUp ? (
          <SignUpForm onToggleMode={() => setIsSignUp(false)} />
        ) : (
          <LoginForm onToggleMode={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  )
}