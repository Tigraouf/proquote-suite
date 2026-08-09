import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubEvent =
  | "souscription"
  | "renouvellement"
  | "changement"
  | "expiration"
  | "annulation"
  | "reprise";

export type SubscriptionEvent = {
  id: string;
  event: SubEvent;
  plan: "free" | "premium";
  cycle: "none" | "monthly" | "yearly";
  amount: number;
  currency: string;
  occurred_at: string;
  period_end: string | null;
  note: string | null;
};

export const SUB_EVENT_LABELS: Record<SubEvent, string> = {
  souscription: "Souscription",
  renouvellement: "Renouvellement",
  changement: "Changement de formule",
  expiration: "Expiration",
  annulation: "Annulation",
  reprise: "Reprise d'abonnement",
};

export function subEventTone(event: SubEvent) {
  switch (event) {
    case "souscription":
    case "renouvellement":
    case "reprise":
      return "bg-primary/12 text-primary";
    case "expiration":
    case "annulation":
      return "bg-destructive/12 text-destructive";
    default:
      return "bg-accent text-accent-foreground";
  }
}

/** Historique des événements d'abonnement de l'utilisateur courant. */
export function useSubscriptionHistory() {
  return useQuery({
    queryKey: ["subscription_events"],
    queryFn: async (): Promise<SubscriptionEvent[]> => {
      const { data, error } = await supabase
        .from("subscription_events")
        .select("*")
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SubscriptionEvent[];
    },
  });
}
