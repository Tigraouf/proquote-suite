import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
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

const PLANS = {
  monthly: { label: "Mensuel", price: "12 €", suffix: "/ mois", note: "Sans engagement" },
  yearly: { label: "Annuel", price: "120 €", suffix: "/ an", note: "2 mois offerts (10 €/mois)" },
} as const;

type Cycle = keyof typeof PLANS;

function Premium() {
  const sub = usePlan();
  const premium = sub.isPremium;
  const [cycle, setCycle] = useState<Cycle>(sub.cycle === "monthly" ? "monthly" : "yearly");
  const plan = PLANS[cycle];



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

        <div className="surface mx-auto mt-6 max-w-md p-4 text-sm">
          <p className="font-medium">
            Statut :{" "}
            {premium
              ? `Premium ${sub.cycleLabel.toLowerCase()} actif`
              : sub.expired
                ? "Abonnement expiré"
                : "Plan gratuit"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {premium && sub.renewsAt
              ? `Renouvellement le ${frDate(sub.renewsAt.toISOString())}${
                  sub.daysLeft !== null ? ` (dans ${sub.daysLeft} j)` : ""
                }`
              : sub.expired
                ? "Les fonctionnalités Premium sont désactivées jusqu'au renouvellement."
                : `Limites en cours : ${FREE_DOCS_PER_MONTH} documents/mois et ${FREE_CLIENT_LIMIT} clients.`}
          </p>
        </div>


        <div className="mt-6 inline-flex rounded-full border border-border bg-muted/50 p-1">
          {(Object.keys(PLANS) as Cycle[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCycle(key)}
              aria-pressed={cycle === key}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                cycle === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PLANS[key].label}
              {key === "yearly" && (
                <span className="ml-2 rounded-full bg-primary/12 px-2 py-0.5 text-xs text-primary">
                  -17 %
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="surface p-6">
          <p className="text-sm text-muted-foreground">Gratuit</p>
          <p className="font-display text-3xl font-semibold">0 €</p>
          <p className="mt-1 text-xs text-muted-foreground">Pour démarrer</p>
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
          <p className="text-sm text-primary">Premium · {plan.label}</p>
          <p className="font-display text-3xl font-semibold">
            {plan.price}{" "}
            <span className="text-base font-normal text-muted-foreground">{plan.suffix}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{plan.note}</p>
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
                "Le paiement en ligne n'est pas encore activé. Dites-moi quand brancher l'abonnement.",
              )
            }
          >
            {premium ? "Vous êtes Premium" : `S'abonner — ${plan.price} ${plan.suffix}`}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Résiliable à tout moment · TVA incluse
          </p>
        </div>
      </div>
    </div>
  );
}

