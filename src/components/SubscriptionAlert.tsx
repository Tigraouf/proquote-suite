import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";
import { frDate } from "@/lib/billing";

/** Bandeau d'information sur l'expiration prochaine ou passée de l'abonnement. */
export function SubscriptionAlert() {
  const plan = usePlan();
  if (plan.loading) return null;

  const soon =
    plan.isPremium && plan.daysLeft !== null && plan.daysLeft >= 0 && plan.daysLeft <= 7;

  if (!plan.expired && !soon) return null;

  return (
    <div
      className={`no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm ${
        plan.expired
          ? "border-destructive/30 bg-destructive/8 text-destructive"
          : "border-primary/30 bg-primary/8 text-foreground"
      }`}
    >
      <span className="flex items-center gap-2">
        {plan.expired ? (
          <AlertTriangle className="size-4 shrink-0" />
        ) : (
          <Clock className="size-4 shrink-0 text-primary" />
        )}
        {plan.expired
          ? `Votre abonnement Premium a expiré le ${frDate(plan.renewsAt?.toISOString())} — les fonctionnalités Premium sont désactivées.`
          : `Votre abonnement se renouvelle le ${frDate(plan.renewsAt?.toISOString())}${
              plan.daysLeft !== null ? ` (dans ${plan.daysLeft} j)` : ""
            }.`}
      </span>
      <Button asChild size="sm" variant={plan.expired ? "default" : "outline"}>
        <Link to="/premium">{plan.expired ? "Réactiver" : "Gérer l'abonnement"}</Link>
      </Button>
    </div>
  );
}
