# Google Authentication Setup for SnappyLearn

## Current Supabase Project Details
- **Supabase URL**: `https://ptlhykwgdidqgaimaxcj.supabase.co`
- **Project Reference**: `ptlhykwgdidqgaimaxcj`
- **Dashboard**: https://supabase.com/dashboard/project/ptlhykwgdidqgaimaxcj

## Steps to Enable Google Authentication

### 1. Set up Google OAuth in Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/ptlhykwgdidqgaimaxcj/auth/providers
2. Find "Google" in the providers list and enable it
3. You'll need these Google OAuth credentials:
   - **Client ID**: `559650623795-agqubhoo2gsalqluntni3gf943s5dtca.apps.googleusercontent.com`
   - **Client Secret**: (You'll need to provide this)

### 2. Configure Google Cloud Console
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create or select your project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add these authorized redirect URIs:
   ```
   https://ptlhykwgdidqgaimaxcj.supabase.co/auth/v1/callback
   https://your-domain.replit.app/auth/callback (for production)
   ```

### 3. Current Environment Variables
The app is currently configured with:
- `GOOGLE_CLIENT_ID`: Already set in environment
- `GOOGLE_CLIENT_SECRET`: Needs to be provided
- `VITE_GOOGLE_CLIENT_ID`: Already configured for frontend

### 4. Test the Setup
Once configured, users can:
- Sign up with Google from the landing page
- Sign in with existing Google accounts
- The system will automatically create user profiles in the database
- Admin users can access the admin portal

## Troubleshooting Authentication Issues
The recent authentication errors were due to database schema mismatches. These have been fixed:
- Updated upsertUser method to handle existing users properly
- Fixed user schema to match database structure
- Improved error handling for duplicate key constraints

## Next Steps
1. Provide the Google Client Secret
2. Enable Google provider in Supabase dashboard
3. Test Google authentication flow
4. Verify admin portal access with promoted user accounts