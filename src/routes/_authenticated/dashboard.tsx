import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Users, TrendingUp, AlertTriangle, Plus, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import {
  euro,
  frDate,
  STATUS_LABELS,
  statusTone,
  FREE_DOCS_PER_MONTH,
  FREE_CLIENT_LIMIT,
  type DocStatus,
} from "@/lib/billing";
import { tradeById } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Facturea" },
      { name: "description", content: "Chiffre d'affaires, devis en cours et factures à relancer." },
      { property: "og:title", content: "Tableau de bord — Facturea" },
      { property: "og:description", content: "Votre activité freelance en un coup d'œil." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const premium = profile?.plan === "premium";

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [docs, clients] = await Promise.all([
        supabase
          .from("documents")
          .select("id, type, number, status, total, issue_date, due_date, client_id")
          .order("issue_date", { ascending: false }),
        supabase.from("clients").select("id, name"),
      ]);
      if (docs.error) throw docs.error;
      if (clients.error) throw clients.error;
      return { docs: docs.data ?? [], clients: clients.data ?? [] };
    },
  });

  const docs = data?.docs ?? [];
  const clients = data?.clients ?? [];
  const now = new Date();
  const monthDocs = docs.filter((d) => {
    const dt = new Date(d.issue_date as string);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });
  const paid = docs.filter((d) => d.type === "facture" && d.status === "paye");
  const revenue = paid.reduce((s, d) => s + Number(d.total), 0);
  const pending = docs.filter((d) => d.type === "facture" && !["paye", "annule"].includes(d.status as string));
  const late = pending.filter((d) => d.due_date && new Date(d.due_date as string) < now);
  const quotes = docs.filter((d) => d.type === "devis" && ["brouillon", "envoye"].includes(d.status as string));
  const trade = tradeById(profile?.trade);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">
            Bonjour {profile?.full_name?.split(" ")[0] ?? ""} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.company_name
              ? `${profile.company_name}${trade ? ` · ${trade.label}` : ""}`
              : "Complétez votre fiche entreprise pour des documents conformes."}
          </p>
        </div>
        <Button asChild>
          <Link to="/documents/new">
            <Plus className="size-4" /> Nouveau document
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={TrendingUp}
          label="Encaissé"
          value={euro(revenue)}
          hint={`${paid.length} facture(s) payée(s)`}
        />
        <Stat
          icon={FileText}
          label="En attente"
          value={euro(pending.reduce((s, d) => s + Number(d.total), 0))}
          hint={`${pending.length} facture(s)`}
        />
        <Stat
          icon={AlertTriangle}
          label="En retard"
          value={String(late.length)}
          hint={premium ? "Relances disponibles" : "Premium pour relancer"}
        />
        <Stat icon={Users} label="Clients" value={String(clients.length)} hint={`${quotes.length} devis en cours`} />
      </div>

      {!premium && (
        <div className="surface mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Lock className="size-4 text-primary" /> Plan gratuit
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {monthDocs.length}/{FREE_DOCS_PER_MONTH} documents ce mois · {clients.length}/
              {FREE_CLIENT_LIMIT} clients
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/premium">Passer en Premium</Link>
          </Button>
        </div>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold">Derniers documents</h2>
      <div className="surface mt-3 divide-y divide-border">
        {docs.slice(0, 8).map((d) => (
          <Link
            key={d.id}
            to="/documents/$id"
            params={{ id: d.id as string }}
            className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {d.number} · {clients.find((c) => c.id === d.client_id)?.name ?? "Sans client"}
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
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Aucun document pour l'instant. Créez votre premier devis.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface p-5">
      <Icon className="size-4 text-primary" />
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
