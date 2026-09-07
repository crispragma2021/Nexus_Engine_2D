import { createClient } from "@supabase/supabase-js";
//#region src/integrations/supabase/client.ts
var OFFLINE_AUTH_MESSAGE = "La autenticación remota no está configurada. Tus proyectos locales seguirán disponibles en este dispositivo.";
function isNewSupabaseApiKey(value) {
	return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}
function createSupabaseFetch(supabaseKey) {
	return (input, init) => {
		const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : void 0);
		if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
		if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) headers.delete("Authorization");
		headers.set("apikey", supabaseKey);
		return fetch(input, {
			...init,
			headers
		});
	};
}
function createOfflineSupabaseClient() {
	const unavailable = () => /* @__PURE__ */ new Error(OFFLINE_AUTH_MESSAGE);
	return { auth: {
		getSession: async () => ({
			data: { session: null },
			error: null
		}),
		onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => void 0 } } }),
		signOut: async () => ({ error: null }),
		signUp: async () => ({
			data: {
				user: null,
				session: null
			},
			error: unavailable()
		}),
		signInWithPassword: async () => ({
			data: {
				user: null,
				session: null
			},
			error: unavailable()
		}),
		signInWithOAuth: async () => ({
			data: {
				provider: "google",
				url: null
			},
			error: unavailable()
		})
	} };
}
function createSupabaseClient() {
	const supabaseUrl = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/"
	}["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
	const supabaseKey = {
		"BASE_URL": "/",
		"DEV": false,
		"MODE": "production",
		"PROD": true,
		"SSR": true,
		"TSS_DEV_SERVER": "false",
		"TSS_DEV_SSR_STYLES_BASEPATH": "/",
		"TSS_DEV_SSR_STYLES_ENABLED": "true",
		"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
		"TSS_INLINE_CSS_ENABLED": "false",
		"TSS_ROUTER_BASEPATH": "",
		"TSS_SERVER_FN_BASE": "/_serverFn/"
	}["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];
	if (!supabaseUrl || !supabaseKey) {
		console.warn("[Supabase] Credenciales no configuradas; se utilizará el modo local.");
		return createOfflineSupabaseClient();
	}
	return createClient(supabaseUrl, supabaseKey, {
		global: { fetch: createSupabaseFetch(supabaseKey) },
		auth: {
			persistSession: true,
			autoRefreshToken: true
		}
	});
}
var client;
var supabase = new Proxy({}, { get(_, property, receiver) {
	client ??= createSupabaseClient();
	return Reflect.get(client, property, receiver);
} });
//#endregion
export { supabase as t };
