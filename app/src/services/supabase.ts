import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = "https://bnregnrapuvjtwufvmzn.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJucmVnbnJhcHV2anR3dWZ2bXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MTMxOTUsImV4cCI6MjEwMDM4OTE5NX0.CmZ0pDWnLIKYpWpfwq9ZX1Ybk6LwC3__qvGz5SQwzcw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function supabaseFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  let headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + (session?.access_token || SUPABASE_KEY),
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  let response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers,
  });

  // If token expired or unauthorized with custom user token, fallback to anon key
  if (response.status === 401 && session?.access_token) {
    headers['Authorization'] = 'Bearer ' + SUPABASE_KEY;
    response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
      ...options,
      headers,
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[${response.status}] ${errText}`);
  }

  if (response.status === 204) return null as unknown as T;
  return await response.json();
}
