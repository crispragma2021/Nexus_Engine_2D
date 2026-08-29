import * as React from "react";
import {
  Github,
  Youtube,
  HelpCircle,
  Tag,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Crown,
  Coins,
  Trophy,
  Lock,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut?: () => void;
}

const SOCIALS = [
  {
    icon: Github,
    text: "Star el repositorio y añade aquí tu nombre de usuario de GitHub para obtener 100 créditos gratuitos.",
  },
  {
    icon: ExternalLink,
    text: "Síguenos e introduce tu nombre de usuario de X aquí para obtener 80 créditos gratuitos.",
  },
  {
    icon: Youtube,
    text: "Suscríbete e introduce tu nombre de usuario de YouTube aquí para obtener 50 créditos gratuitos.",
  },
];

const ACHIEVEMENTS = [
  {
    title: "Primer evento",
    text: "Has añadido tu primer evento, ¡estamos seguros de que no será el último!",
    date: "11/8/2026",
    unlocked: true,
  },
  {
    title: "Primer comportamiento",
    text: "Usaste un comportamiento por primera vez, las cosas son mucho más simples con ellos, ¿no crees?",
    unlocked: false,
  },
  {
    title: "Primera vista previa",
    text: "¡Previsualizar tu juego es el primer paso hacia un juego completo!",
    unlocked: false,
  },
];

function Collapsible({ label, disabled }: { label: string; disabled?: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-md border border-separator">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left text-base text-foreground disabled:text-muted-foreground"
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        {label}
      </button>
      {open && !disabled ? (
        <p className="px-11 pb-4 text-sm text-muted-foreground">Nada por aquí todavía.</p>
      ) : null}
    </div>
  );
}

export function ProfileDialog({ open, onOpenChange, onSignOut }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-lg flex-col gap-0 border-separator bg-window p-0">
        <DialogTitle className="px-5 pb-3 pt-5 text-2xl font-bold text-foreground">
          Mi perfil
        </DialogTitle>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5">
          <div
            className="size-16 rounded-full bg-gradient-to-br from-[#7046EC] to-[#FF8569]"
            aria-hidden
          />
          <h3 className="text-xl font-bold text-foreground">creador</h3>

          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-base text-foreground">tu-cuenta@ejemplo.com</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Biografía</p>
            <p className="text-base text-foreground">No se ha definido la bio.</p>
          </div>

          <div>
            <p className="mb-3 text-sm text-muted-foreground">Redes Sociales</p>
            <ul className="space-y-4">
              {SOCIALS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3">
                  <Icon className="mt-0.5 size-6 shrink-0 text-foreground" />
                  <p className="text-sm leading-relaxed text-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Enlace de donación</p>
            <p className="text-base text-foreground">No hay enlace definido.</p>
          </div>

          <section className="space-y-3">
            <h4 className="text-xl font-bold text-foreground">Suscripciones</h4>
            <p className="text-base text-muted-foreground">
              Publicar en Android, iOS, desbloquear más proyectos en la nube, tablas de
              clasificación, funciones de colaboración y más servicios en línea.{" "}
              <a href="#" className="text-link underline">
                Aprende más
              </a>
            </p>
            <div className="flex items-center gap-4 rounded-xl border-2 border-[#45D9A1] bg-elevated p-4">
              <Crown className="size-8 shrink-0 text-[#FFBC57]" />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-base font-semibold text-foreground">
                  ¡Desbloquea el acceso completo para crear sin límites!
                </p>
                <button
                  type="button"
                  className="w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground"
                >
                  Seleccione una suscripción
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-xl font-bold text-foreground">Créditos</h4>
            <p className="text-base text-muted-foreground">
              Consigue ventajas y beneficios en la nube cuando te acerques al lanzamiento de tu
              juego.{" "}
              <a href="#" className="text-link underline">
                Más información
              </a>
            </p>
            <div className="space-y-3 rounded-xl bg-primary p-4">
              <p className="flex items-center gap-3 text-base font-medium text-primary-foreground">
                <Coins className="size-6 text-[#FFBC57]" /> Créditos disponibles: 0
              </p>
              <button
                type="button"
                className="w-full rounded-md border border-primary-foreground/70 py-3 text-sm font-bold text-primary-foreground"
              >
                Obtener paquetes de créditos
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-xl font-bold text-foreground">Contribuciones</h4>
            <Collapsible label="Extensiones (0)" />
            <Collapsible label="Ejemplos (0)" />
            <Collapsible label="Recursos (¡próximamente!)" disabled />
            <p className="text-center text-sm text-muted-foreground">
              ¿Faltan algunas contribuciones? Si eres el autor, agrega tu nombre de usuario en los
              autores del ejemplo o la extensión, o pídeselo al autor original.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-xl font-bold text-foreground">Logros</h4>
            <div className="py-2 text-center">
              <Trophy className="mx-auto size-10 text-[#C9B6FC]" />
              <p className="mt-2 text-lg font-bold text-foreground">1/22 logros</p>
            </div>
            <ul className="space-y-4">
              {ACHIEVEMENTS.map((a) => (
                <li key={a.title} className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        a.unlocked
                          ? "text-base font-bold text-foreground"
                          : "text-base font-bold text-muted-foreground"
                      }
                    >
                      {a.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{a.text}</p>
                  </div>
                  {a.unlocked ? (
                    <span className="shrink-0 text-sm text-foreground">{a.date}</span>
                  ) : (
                    <Lock className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              className="w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Edición de Mi Perfil
            </button>
            <button
              type="button"
              className="w-full rounded-md border border-separator py-3 text-sm font-semibold text-foreground"
            >
              Cambiar mi dirección de correo electrónico
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-separator py-3 text-sm font-semibold text-foreground"
            >
              <ExternalLink className="size-4" /> Acceder al perfil público
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-separator px-4 py-3">
          <HelpCircle className="size-6 shrink-0 text-muted-foreground" />
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-md border border-separator px-3 py-2.5 text-sm font-semibold text-foreground"
          >
            Cerrar sesión
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-separator px-3 py-2.5 text-sm font-semibold text-foreground"
          >
            <Tag className="size-4" /> Canjear
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-auto rounded-md border border-separator px-4 py-2.5 text-sm font-semibold text-foreground"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
