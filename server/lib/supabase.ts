import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
  })
  throw new Error('Missing Supabase environment variables')
}

// Configure Supabase client options for Replit environment
const clientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

// Admin client for backend operations (user creation, etc.)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, clientOptions)

// User client for token validation - uses same keys as frontend
export const supabaseUser = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, clientOptions)