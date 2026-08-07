import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  euro,
  frDate,
  paymentStateTone,
  paymentSummary,
  PAYMENT_STATE_LABELS,
  STATUS_LABELS,
  statusTone,
  type DocStatus,
} from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/documents/")({
  head: () => ({
    meta: [
      { title: "Devis & factures — Facturea" },
      { name: "description", content: "Retrouvez tous vos devis et factures, leur statut et leur montant." },
      { property: "og:title", content: "Devis & factures — Facturea" },
      { property: "og:description", content: "Suivi complet de vos documents commerciaux." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"tous" | "devis" | "facture">("tous");

  const { data } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const [docs, clients, payments] = await Promise.all([
        supabase.from("documents").select("*").order("issue_date", { ascending: false }),
        supabase.from("clients").select("id, name"),
        supabase.from("payments").select("document_id, amount"),
      ]);
      if (docs.error) throw docs.error;
      if (clients.error) throw clients.error;
      if (payments.error) throw payments.error;
      return { docs: docs.data ?? [], clients: clients.data ?? [], payments: payments.data ?? [] };
    },
  });

  const clients = data?.clients ?? [];
  const payments = data?.payments ?? [];
  const docs = (data?.docs ?? []).filter((d) => {
    if (filter !== "tous" && d.type !== filter) return false;
    if (!q.trim()) return true;
    const client = clients.find((c) => c.id === d.client_id)?.name ?? "";
    return `${d.number} ${client}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Devis & factures</h1>
          <p className="mt-1 text-sm text-muted-foreground">{docs.length} document(s)</p>
        </div>
        <Button asChild>
          <Link to="/documents/new">
            <Plus className="size-4" /> Nouveau
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher un numéro ou un client"
            value={q}
            maxLength={80}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["tous", "devis", "facture"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                filter === f ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="surface mt-5 divide-y divide-border">
        {docs.map((d) => (
          <Link
            key={d.id as string}
            to="/documents/$id"
            params={{ id: d.id as string }}
            className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/60"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {d.number as string} · {clients.find((c) => c.id === d.client_id)?.name ?? "Sans client"}
              </p>
              <p className="text-xs text-muted-foreground">
                {d.type === "devis" ? "Devis" : "Facture"} · {frDate(d.issue_date as string)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(d.status as DocStatus)}`}>
                {STATUS_LABELS[d.status as DocStatus]}
              </span>
              <span className="text-sm font-semibold">{euro(Number(d.total))}</span>
            </div>
          </Link>
        ))}
        {docs.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">Aucun document trouvé.</p>
        )}
      </div>
    </div>
  );
}
