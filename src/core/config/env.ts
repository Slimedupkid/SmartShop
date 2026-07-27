import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  
  // Crawler API Variables
  CHECKERS_COOKIE: z.string().min(1, "Checkers session cookie is required"),
  CHECKERS_STORE_ID: z.string().min(1, "Checkers default store ID is required"),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  
  CHECKERS_COOKIE: process.env.CHECKERS_COOKIE,
  CHECKERS_STORE_ID: process.env.CHECKERS_STORE_ID,
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;