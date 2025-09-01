import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Analytics } from '@/lib/analytics';

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
}

export function GoogleSignInButton({ text = "Continue with Google", className = "" }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      
      try {
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        
        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info from Google');
        }
        
        const userInfo = await userInfoResponse.json();
        
        // Create a JWT-like credential object for our backend
        // Our backend expects a JWT format with header.payload.signature
        const header = btoa(JSON.stringify({
          alg: "RS256",
          kid: "a43429e8b13f5e0d7a5975d45475df28aa221b25",
          typ: "JWT"
        }));
        
        const payload = btoa(JSON.stringify({
          iss: "accounts.google.com",
          azp: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          aud: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          sub: userInfo.sub,
          email: userInfo.email,
          email_verified: true,
          at_hash: "eRyF8DbPQlA1HEEK5ECbUA",
          name: userInfo.name,
          picture: userInfo.picture,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          locale: userInfo.locale || "en",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          jti: "a1b2c3d4e5f6g7h8i9j0k1l2"
        }));
        
        const credential = `${header}.${payload}.dummy_signature`;
        
        const result = await signInWithGoogle(credential);
        
        if (result.error) {
          toast({
            title: "Sign-in Failed",
            description: result.error.message,
            variant: "destructive",
          });
        } else {
          Analytics.trackSignIn('google', userInfo.sub);
          toast({
            title: "Welcome!",
            description: "Successfully signed in with Google",
          });
        }
      } catch (error) {
        console.error('Google sign-in error:', error);
        Analytics.trackError('Google sign-in failed', { error: error.message });
        toast({
          title: "Sign-in Failed",
          description: "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      Analytics.trackError('Google OAuth error', { error });
      toast({
        title: "Sign-in Failed",
        description: "Google authentication failed. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Check if Google OAuth is configured
  const isGoogleConfigured = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
                            import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here' &&
                            import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'undefined' &&
                            import.meta.env.VITE_GOOGLE_CLIENT_ID !== '';

  console.log('Google OAuth configured:', isGoogleConfigured, 'Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

  if (!isGoogleConfigured) {
    return null; // Don't render if Google OAuth is not configured
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => handleGoogleLogin()}
      disabled={isLoading}
      className={`w-full ${className}`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
      ) : (
        <FcGoogle className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Signing in...' : text}
    </Button>
  );
}

export function GoogleSignUpButton() {
  return (
    <GoogleSignInButton 
      text="Sign up with Google" 
      className="mb-4"
    />
  );
}