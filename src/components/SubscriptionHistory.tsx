import { History } from "lucide-react";
import {
  SUB_EVENT_LABELS,
  subEventTone,
  useSubscriptionHistory,
} from "@/hooks/useSubscriptionHistory";
import { CYCLE_LABELS } from "@/hooks/usePlan";
import { euro, frDate } from "@/lib/billing";

/** Tableau récapitulatif de l'historique d'abonnement. */
export function SubscriptionHistory() {
  const { data, isLoading } = useSubscriptionHistory();

  return (
    <section className="surface mt-8 p-6 text-left">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <History className="size-4 text-primary" /> Historique d'abonnement
      </h2>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>
      ) : !data || data.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun événement pour le moment. Votre premier abonnement apparaîtra ici.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2">Date</th>
                <th className="pb-2">Événement</th>
                <th className="pb-2">Formule</th>
                <th className="pb-2">Période jusqu'au</th>
                <th className="pb-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="py-2.5 whitespace-nowrap">{frDate(e.occurred_at)}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${subEventTone(e.event)}`}
                    >
                      {SUB_EVENT_LABELS[e.event]}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{CYCLE_LABELS[e.cycle]}</td>
                  <td className="py-2.5 text-muted-foreground">{frDate(e.period_end)}</td>
                  <td className="py-2.5 text-right">{euro(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
