import { Github, Youtube, HelpCircle, Tag, ExternalLink } from "lucide-react";
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

export function ProfileDialog({ open, onOpenChange, onSignOut }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-lg flex-col gap-0 border-separator bg-window p-0">
        <DialogTitle className="px-5 pb-3 pt-5 text-2xl font-bold text-foreground">
          Mi perfil
        </DialogTitle>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5">
          <div className="size-16 rounded-full bg-gradient-to-br from-[#7046EC] to-[#FF8569]" aria-hidden />
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
