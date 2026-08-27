import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Crown, GraduationCap, Hammer, Home, Languages, Menu, Gamepad2, Store } from "lucide-react";
import { MainMenuDrawer } from "./MainMenuDrawer";
import { CreateGameDialog } from "./CreateGameDialog";
import { ProfileDialog } from "./ProfileDialog";
import { LanguageDialog } from "./LanguageDialog";
import { CreateView } from "./CreateView";
import { LearnView } from "./LearnView";
import { PlayView } from "./PlayView";
import { StoreView } from "./StoreView";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type TabId = "learn" | "create" | "play" | "store";

const TABS: Array<{ id: TabId; label: string; icon: typeof Home }> = [
  { id: "learn", label: "Aprende", icon: GraduationCap },
  { id: "create", label: "Crear", icon: Hammer },
  { id: "play", label: "Juega", icon: Gamepad2 },
  { id: "store", label: "Tienda", icon: Store },
];

export function AppShell() {
  const [tab, setTab] = useState<TabId>("create");
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
  };


  return (
    <div className="flex h-screen flex-col overflow-hidden bg-window">
      <header className="shrink-0 border-b border-separator bg-window">
        <div className="flex h-14 items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="p-2 text-foreground"
          >
            <Menu className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => setTab("create")}
            aria-label="Inicio"
            className={cn(
              "rounded-t-lg border-x border-t px-3 py-2 text-foreground",
              tab === "create" ? "border-separator bg-elevated" : "border-transparent",
            )}
          >
            <Home className="size-6" />
          </button>
          {email ? (
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="ml-auto flex items-center gap-2 text-base font-bold text-foreground"
            >
              <span
                className="size-7 rounded-md bg-gradient-to-br from-[#7046EC] to-[#FF8569]"
                aria-hidden
              />
              Mi perfil
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate({ to: "/auth", search: { next: "/" } })}
              className="ml-auto rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
            >
              Iniciar sesión
            </button>
          )}

        </div>

        <div className="flex h-12 items-center gap-3 border-t border-separator bg-toolbar px-3">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Cuenta"
            className="size-7 rounded-md bg-gradient-to-br from-[#C9B6FC] to-[#7046EC]"
          />
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#45D9A1] to-[#FFBC57] px-4 py-2 text-sm font-bold text-[#1D1D26]"
          >
            <Crown className="size-4" /> Obtener prémium
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button type="button" aria-label="Notificaciones" className="p-2 text-foreground">
              <Bell className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Idioma"
              onClick={() => setLangOpen(true)}
              className="p-2 text-foreground"
            >
              <Languages className="size-5" />
            </button>
            <Link
              to="/editor"
              className="ml-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Editor
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {tab === "learn" && <LearnView />}
        {tab === "create" && <CreateView onCreateGame={() => setCreateOpen(true)} />}
        {tab === "play" && <PlayView />}
        {tab === "store" && <StoreView />}
      </main>

      <nav className="grid shrink-0 grid-cols-4 border-t border-separator bg-toolbar">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {active && (
                <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[#C9B6FC]" />
              )}
              <Icon className="size-6" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      <MainMenuDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        hasProject={false}
        onCreateGame={() => setCreateOpen(true)}
        onPreferences={() => setProfileOpen(true)}
      />
      <CreateGameDialog open={createOpen} onOpenChange={setCreateOpen} />
      <LanguageDialog open={langOpen} onOpenChange={setLangOpen} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} onSignOut={signOut} />
    </div>
  );
}
