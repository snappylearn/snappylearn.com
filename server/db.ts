import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use postgres-js driver which works with Supabase and standard PostgreSQL
// Configure for Replit environment with SSL handling
const client = postgres(process.env.DATABASE_URL, { 
  ssl: { 
    rejectUnauthorized: false,
    require: true
  },
  max: 10,
  idle_timeout: 20,
  connect_timeout: 60,
  prepare: false
});

export const db = drizzle(client, { schema });