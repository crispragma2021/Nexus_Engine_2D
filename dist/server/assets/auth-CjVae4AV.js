import { t as Route } from "./auth-n7F3lr13.js";
import { t as supabase } from "./client-CFB4ucS5.js";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/auth.tsx?tsr-split=component
function safeNext(next) {
	return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
function AuthPage() {
	const { next } = Route.useSearch();
	const navigate = useNavigate();
	const [mode, setMode] = useState("signin");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState(null);
	const [error, setError] = useState(null);
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) window.location.replace(safeNext(next));
		});
	}, [next]);
	async function onSubmit(e) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		setMessage(null);
		if (mode === "signup") {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: { emailRedirectTo: `${window.location.origin}${safeNext(next)}` }
			});
			setBusy(false);
			if (error) return setError(error.message);
			if (!data.session) return setMessage("Revisa tu correo para confirmar la cuenta.");
			navigate({ to: safeNext(next) });
			return;
		}
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		setBusy(false);
		if (error) return setError(error.message);
		window.location.replace(safeNext(next));
	}
	async function onGoogle() {
		setError(null);
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: `${window.location.origin}/auth${next ? `?next=${encodeURIComponent(safeNext(next))}` : ""}` }
		});
		if (error) return setError(error.message);
		if (data.url) window.location.assign(data.url);
	}
	return /* @__PURE__ */ jsx("main", {
		className: "flex min-h-screen items-center justify-center bg-window px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "w-full max-w-sm rounded-xl border border-separator bg-elevated p-6",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-bold text-foreground",
					children: mode === "signin" ? "Iniciar sesión" : "Crear cuenta"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Necesario para guardar y recuperar tus proyectos en este dispositivo."
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onGoogle,
					className: "mt-5 w-full rounded-md border border-separator py-3 text-sm font-semibold text-foreground",
					children: "Continuar con Google"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "my-4 flex items-center gap-3 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-separator" }),
						" o",
						" ",
						/* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-separator" })
					]
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit,
					className: "space-y-3",
					children: [
						/* @__PURE__ */ jsx("input", {
							type: "email",
							required: true,
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "Correo",
							autoComplete: "email",
							className: "w-full rounded-md border border-separator bg-window px-3 py-3 text-sm text-foreground"
						}),
						/* @__PURE__ */ jsx("input", {
							type: "password",
							required: true,
							minLength: 6,
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "Contraseña",
							autoComplete: mode === "signin" ? "current-password" : "new-password",
							className: "w-full rounded-md border border-separator bg-window px-3 py-3 text-sm text-foreground"
						}),
						error && /* @__PURE__ */ jsx("p", {
							className: "text-sm text-destructive",
							children: error
						}),
						message && /* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: message
						}),
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: busy,
							className: "w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60",
							children: mode === "signin" ? "Entrar" : "Registrarme"
						})
					]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => setMode(mode === "signin" ? "signup" : "signin"),
					className: "mt-4 w-full text-sm text-muted-foreground",
					children: mode === "signin" ? "¿No tienes cuenta? Crear una" : "Ya tengo cuenta"
				})
			]
		})
	});
}
//#endregion
export { AuthPage as component };
