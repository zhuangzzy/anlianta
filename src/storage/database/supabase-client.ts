import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function getSupabaseCredentials(): SupabaseCredentials {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
               process.env.COZE_SUPABASE_URL ||
               process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   process.env.COZE_SUPABASE_ANON_KEY ||
                   process.env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Supabase URL is not set. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }
  if (!anonKey) {
    throw new Error('Supabase Anon Key is not set. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.');
  }

  return { url, anonKey };
}

function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || 
         process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  let key: string;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }

  if (token) {
    return createClient(url, key, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient(url, key, {
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseServerClient(token?: string): SupabaseClient {
  return getSupabaseClient(token);
}

export function getSupabaseUrl(): string {
  return getSupabaseCredentials().url;
}

export function getSupabaseAnonKey(): string {
  return getSupabaseCredentials().anonKey;
}
