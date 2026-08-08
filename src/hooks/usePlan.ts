import { useProfile } from "@/hooks/useProfile";
import { FREE_CLIENT_LIMIT, FREE_DOCS_PER_MONTH } from "@/lib/billing";

export type PlanCycle = "none" | "monthly" | "yearly";

export const CYCLE_LABELS: Record<PlanCycle, string> = {
  none: "Sans abonnement",
  monthly: "Mensuel",
  yearly: "Annuel",
};

export type PlanState = {
  /** Plan enregistré côté compte. */
  plan: "free" | "premium";
  /** Formule d'abonnement choisie. */
  cycle: PlanCycle;
  cycleLabel: string;
  /** Premium réellement actif (abonnement non expiré). */
  isPremium: boolean;
  /** Le compte est Premium mais l'échéance est dépassée. */
  expired: boolean;
  renewsAt: Date | null;
  /** Jours restants avant renouvellement (null si inconnu). */
  daysLeft: number | null;
  loading: boolean;
  limits: { clients: number | null; docsPerMonth: number | null };
};

/** Vérifie le statut d'abonnement et renvoie les limites applicables. */
export function usePlan(): PlanState {
  const { data: profile, isLoading } = useProfile();

  const plan = profile?.plan ?? "free";
  const cycle = (profile?.plan_cycle ?? "none") as PlanCycle;
  const renewsAt = profile?.plan_renews_at ? new Date(profile.plan_renews_at) : null;
  const expired = plan === "premium" && renewsAt !== null && renewsAt.getTime() < Date.now();
  const isPremium = plan === "premium" && !expired;

  const daysLeft = renewsAt
    ? Math.ceil((renewsAt.getTime() - Date.now()) / 86_400_000)
    : null;

  return {
    plan,
    cycle,
    cycleLabel: CYCLE_LABELS[cycle],
    isPremium,
    expired,
    renewsAt,
    daysLeft,
    loading: isLoading,
    limits: isPremium
      ? { clients: null, docsPerMonth: null }
      : { clients: FREE_CLIENT_LIMIT, docsPerMonth: FREE_DOCS_PER_MONTH },
  };
}
