import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Iniciar sesión · GDevelop Design Guru" },
      {
        name: "description",
        content:
          "Inicia sesión para acceder a tus proyectos y a las herramientas de agente (MCP) del estudio.",
      },
      { property: "og:title", content: "Iniciar sesión · GDevelop Design Guru" },
      {
        property: "og:description",
        content: "Accede con correo o Google al estudio de creación de juegos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "",
  }),
  component: AuthPage,
});

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(safeNext(next));
    });
  }, [next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}${safeNext(next)}` },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (!data.session) return setMessage("Revisa tu correo para confirmar la cuenta.");
      navigate({ to: safeNext(next) });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.replace(safeNext(next));
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth${next ? `?next=${encodeURIComponent(safeNext(next))}` : ""}`,
    });
    if (result.error) return setError(result.error.message ?? "No se pudo iniciar sesión con Google.");
    if (result.redirected) return;
    window.location.replace(safeNext(next));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-window px-4">
      <div className="w-full max-w-sm rounded-xl border border-separator bg-elevated p-6">
        <h1 className="text-2xl font-bold text-foreground">
          {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Necesario para tus proyectos y para conectar asistentes de IA (MCP).
        </p>

        <button
          type="button"
          onClick={onGoogle}
          className="mt-5 w-full rounded-md border border-separator py-3 text-sm font-semibold text-foreground"
        >
          Continuar con Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-separator" /> o <span className="h-px flex-1 bg-separator" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            autoComplete="email"
            className="w-full rounded-md border border-separator bg-window px-3 py-3 text-sm text-foreground"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="w-full rounded-md border border-separator bg-window px-3 py-3 text-sm text-foreground"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {mode === "signin" ? "Entrar" : "Registrarme"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-sm text-muted-foreground"
        >
          {mode === "signin" ? "¿No tienes cuenta? Crear una" : "Ya tengo cuenta"}
        </button>
      </div>
    </main>
  );
}
