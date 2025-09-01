import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleOAuthWrapperProps {
  children: React.ReactNode;
}

export function GoogleOAuthWrapper({ children }: GoogleOAuthWrapperProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  
  console.log('Google OAuth client ID:', clientId);
  
  if (!clientId || clientId === 'your_google_client_id_here' || clientId === 'undefined') {
    // Return children without Google OAuth if not configured
    console.log('Google OAuth not configured, falling back to regular auth');
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}