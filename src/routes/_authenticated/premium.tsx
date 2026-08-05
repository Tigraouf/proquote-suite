import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { FREE_CLIENT_LIMIT, FREE_DOCS_PER_MONTH } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({
    meta: [
      { title: "Passer en Premium — Facturea" },
      { name: "description", content: "Documents illimités, relances automatiques et export comptable." },
      { property: "og:title", content: "Passer en Premium — Facturea" },
      { property: "og:description", content: "Débloquez tout le potentiel de votre facturation freelance." },
    ],
  }),
  component: Premium,
});

const FREE = [
  `${FREE_DOCS_PER_MONTH} documents par mois`,
  `${FREE_CLIENT_LIMIT} clients`,
  "Devis & factures conformes",
  "Export PDF / impression",
];

const PRO = [
  "Documents et clients illimités",
  "Relances automatiques des impayés",
  "Suivi des paiements et retards",
  "Export comptable (CSV) annuel",
  "Personnalisation logo & couleurs",
  "Support prioritaire",
];

function Premium() {
  const { data: profile } = useProfile();
  const premium = profile?.plan === "premium";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5" /> Premium
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold">Facturez sans limite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un abonnement simple, résiliable à tout moment.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="surface p-6">
          <p className="text-sm text-muted-foreground">Gratuit</p>
          <p className="font-display text-3xl font-semibold">0 €</p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {FREE.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface border-primary/40 p-6 ring-1 ring-primary/20">
          <p className="text-sm text-primary">Premium</p>
          <p className="font-display text-3xl font-semibold">
            12 € <span className="text-base font-normal text-muted-foreground">/ mois</span>
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {PRO.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            className="mt-6 w-full"
            disabled={premium}
            onClick={() =>
              toast.info(
                "Le paiement en ligne sera activé prochainement. Dites-moi quand brancher l'abonnement.",
              )
            }
          >
            {premium ? "Vous êtes Premium" : "S'abonner"}
          </Button>
        </div>
      </div>
    </div>
  );
}
