import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type SupabaseClient = ReturnType<typeof createClient<Database>>;

const OFFLINE_AUTH_MESSAGE =
  "La autenticación remota no está configurada. Tus proyectos locales seguirán disponibles en este dispositivo.";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createOfflineSupabaseClient(): SupabaseClient {
  const unavailable = () => new Error(OFFLINE_AUTH_MESSAGE);

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
      signOut: async () => ({ error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: unavailable() }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: unavailable(),
      }),
      signInWithOAuth: async () => ({
        data: { provider: "google", url: null },
        error: unavailable(),
      }),
    },
  } as unknown as SupabaseClient;
}

function createSupabaseClient(): SupabaseClient {
  // Use import.meta.env for client-side (Vite build-time replacement) and
  // fall back to process.env for server-side rendering.
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const supabaseKey =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Supabase] Credenciales no configuradas; se utilizará el modo local.");
    return createOfflineSupabaseClient();
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    global: { fetch: createSupabaseFetch(supabaseKey) },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let client: SupabaseClient | undefined;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, property, receiver) {
    client ??= createSupabaseClient();
    return Reflect.get(client, property, receiver);
  },
});
