import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const DEFAULT_PERKS = [
  "Documents et clients illimités",
  "Relances automatiques des impayés",
  "Suivi détaillé des paiements",
  "Export comptable (CSV)",
];

export type PremiumLockProps = {
  title: string;
  description: string;
  perks?: string[];
  /** Version condensée pour s'insérer dans une page existante. */
  compact?: boolean;
  /** Bouton secondaire optionnel (ex. retour). */
  secondary?: React.ReactNode;
};

/** Écran de verrouillage affiché quand une fonctionnalité Premium est atteinte. */
export function PremiumLock({
  title,
  description,
  perks = DEFAULT_PERKS,
  compact = false,
  secondary,
}: PremiumLockProps) {
  if (compact) {
    return (
      <div className="no-print surface mt-6 flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
        <span className="flex items-start gap-2">
          <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">{title}</span>
            <span className="block text-muted-foreground">{description}</span>
          </span>
        </span>
        <Button asChild size="sm">
          <Link to="/premium">Passer en Premium</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="no-print surface mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent">
        <Lock className="size-5 text-primary" />
      </span>
      <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="size-3.5" /> Fonctionnalité Premium
      </span>
      <h2 className="mt-3 font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm">
        {perks.map((p) => (
          <li key={p} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/premium">Passer en Premium</Link>
        </Button>
        {secondary}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Dès 10 €/mois · résiliable à tout moment
      </p>
    </div>
  );
}

/** Même écran de verrouillage, présenté en modale lors d'une action bloquée. */
export function PremiumLockDialog({
  open,
  onOpenChange,
  ...props
}: PremiumLockProps & { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">{props.title}</DialogTitle>
        <PremiumLock
          {...props}
          secondary={
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Plus tard
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
