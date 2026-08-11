import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PremiumLock } from "@/components/PremiumLock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCsv, euro, frDate, methodLabel, STATUS_LABELS, toCsv, type DocStatus } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/exports")({
  head: () => ({
    meta: [
      { title: "Export comptable — Facturea" },
      {
        name: "description",
        content: "Exportez vos factures, devis et règlements en CSV pour votre expert-comptable.",
      },
      { property: "og:title", content: "Export comptable — Facturea" },
      { property: "og:description", content: "Journal des ventes et encaissements au format tableur." },
    ],
  }),
  component: Exports,
});

const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

function Exports() {
  const { isPremium } = usePlan();
  const [year, setYear] = useState(YEARS[0]!);

  const { data, isLoading } = useQuery({
    queryKey: ["export", year],
    enabled: isPremium,
    queryFn: async () => {
      const from = `${year}-01-01`;
      const to = `${year}-12-31`;
      const [docs, clients, payments] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .gte("issue_date", from)
          .lte("issue_date", to)
          .order("issue_date"),
        supabase.from("clients").select("id, name, siret, vat_number"),
        supabase.from("payments").select("*").gte("paid_on", from).lte("paid_on", to).order("paid_on"),
      ]);
      if (docs.error) throw docs.error;
      if (clients.error) throw clients.error;
      if (payments.error) throw payments.error;
      return { docs: docs.data ?? [], clients: clients.data ?? [], payments: payments.data ?? [] };
    },
  });

  const invoices = (data?.docs ?? []).filter((d) => d.type === "facture");
  const revenue = invoices
    .filter((d) => d.status !== "annule")
    .reduce((s, d) => s + Number(d.total ?? 0), 0);
  const cashed = (data?.payments ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0);

  function clientName(id: string | null) {
    if (!id) return "";
    return (data?.clients ?? []).find((c) => c.id === id)?.name ?? "";
  }

  function exportSales() {
    if (!data) return;
    const rows: (string | number)[][] = [
      [
        "Date",
        "Type",
        "Numéro",
        "Client",
        "SIRET client",
        "Statut",
        "Total HT",
        "Taux TVA",
        "TVA",
        "Total TTC",
      ],
      ...data.docs.map((d) => [
        d.issue_date as string,
        d.type === "facture" ? "Facture" : "Devis",
        d.number as string,
        clientName(d.client_id as string | null),
        (data.clients.find((c) => c.id === d.client_id)?.siret as string) ?? "",
        STATUS_LABELS[d.status as DocStatus],
        Number(d.subtotal ?? 0).toFixed(2).replace(".", ","),
        String(Number(d.vat_rate ?? 0)).replace(".", ","),
        Number(d.vat_amount ?? 0).toFixed(2).replace(".", ","),
        Number(d.total ?? 0).toFixed(2).replace(".", ","),
      ]),
    ];
    downloadCsv(`journal-ventes-${year}.csv`, toCsv(rows));
    toast.success("Journal des ventes exporté");
  }

  function exportPayments() {
    if (!data) return;
    const byDoc = new Map(data.docs.map((d) => [d.id as string, d]));
    const rows: (string | number)[][] = [
      ["Date de règlement", "Facture", "Client", "Moyen", "Montant", "Note"],
      ...data.payments.map((p) => {
        const doc = byDoc.get(p.document_id as string);
        return [
          p.paid_on as string,
          (doc?.number as string) ?? "",
          clientName((doc?.client_id as string | null) ?? null),
          methodLabel(p.method as string),
          Number(p.amount ?? 0).toFixed(2).replace(".", ","),
          (p.note as string) ?? "",
        ];
      }),
    ];
    downloadCsv(`encaissements-${year}.csv`, toCsv(rows));
    toast.success("Journal des encaissements exporté");
  }

  if (!isPremium) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">Export comptable</h1>
        <div className="mt-8">
          <PremiumLock
            title="Export comptable verrouillé"
            description="Générez le journal des ventes et des encaissements de l'année au format CSV, prêt pour votre expert-comptable."
            perks={[
              "Journal des ventes annuel (HT, TVA, TTC)",
              "Journal des encaissements détaillé",
              "Format CSV compatible tableur",
              "Récapitulatif du chiffre d'affaires",
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Export comptable</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Téléchargez vos journaux annuels au format CSV pour votre comptabilité.
      </p>

      <div className="surface mt-6 space-y-5 p-6">
        <div className="max-w-xs space-y-1.5">
          <Label>Exercice</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Documents" value={String(data?.docs.length ?? 0)} />
          <Stat label="CA facturé" value={euro(revenue)} />
          <Stat label="Encaissé" value={euro(cashed)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={exportSales} disabled={isLoading || !data?.docs.length}>
            <FileSpreadsheet className="size-4" /> Journal des ventes
          </Button>
          <Button variant="outline" onClick={exportPayments} disabled={isLoading || !data?.payments.length}>
            <Download className="size-4" /> Encaissements
          </Button>
        </div>
        {!isLoading && !data?.docs.length && (
          <p className="text-xs text-muted-foreground">Aucun document sur l'exercice {year}.</p>
        )}
      </div>

      <div className="surface mt-5 p-6">
        <h2 className="font-display text-lg font-semibold">Dernières factures de l'exercice</h2>
        <div className="mt-4 space-y-2 text-sm">
          {invoices.slice(-5).reverse().map((d) => (
            <div key={d.id as string} className="flex justify-between border-b border-border/60 pb-2">
              <span>
                {d.number as string} · {frDate(d.issue_date as string)}
              </span>
              <span>{euro(Number(d.total ?? 0))}</span>
            </div>
          ))}
          {!invoices.length && <p className="text-muted-foreground">Aucune facture.</p>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold">{value}</p>
    </div>
  );
}
