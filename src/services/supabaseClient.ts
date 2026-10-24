import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read public/publishable credentials from Vite environment
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('http')
);

// Fallback to placeholder in test/build environments without throwing
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseKey : 'placeholder-anon-key';

// Dummy WebSocket transport for Node.js test runners without native WebSocket
class NodeTestWebSocketTransport {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
  close() {}
  send() {}
}

const isBrowser = typeof window !== 'undefined';

export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
  ...(typeof globalThis.WebSocket === 'undefined' ? {
    realtime: {
      transport: NodeTestWebSocketTransport as any,
    },
  } : {}),
});
