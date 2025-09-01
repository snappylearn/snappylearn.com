import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// Admin client for backend operations (user creation, etc.)
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// User client for token validation - uses same keys as frontend
export const supabaseUser = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey)