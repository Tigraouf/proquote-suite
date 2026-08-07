import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Printer, Send, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { euro, frDate, STATUS_LABELS, statusTone, type DocStatus } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/documents/$id/")({
  head: () => ({
    meta: [
      { title: "Document — Facturea" },
      { name: "description", content: "Aperçu imprimable de votre devis ou facture." },
      { property: "og:title", content: "Document — Facturea" },
      { property: "og:description", content: "Aperçu et envoi de votre document commercial." },
    ],
  }),
  component: DocumentDetail,
});

function DocumentDetail() {
  const { id } = useParams({ from: "/_authenticated/documents/$id" });
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const premium = profile?.plan === "premium";

  const { data, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const doc = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
      if (doc.error) throw doc.error;
      const items = await supabase
        .from("document_items")
        .select("*")
        .eq("document_id", id)
        .order("position");
      if (items.error) throw items.error;
      let client = null;
      if (doc.data?.client_id) {
        const c = await supabase.from("clients").select("*").eq("id", doc.data.client_id).maybeSingle();
        client = c.data;
      }
      return { doc: doc.data, items: items.data ?? [], client };
    },
  });

  const setStatus = useMutation({
    mutationFn: async (status: DocStatus) => {
      const { error } = await supabase
        .from("documents")
        .update({ status, paid_at: status === "paye" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!data?.doc) return <p className="text-sm text-muted-foreground">Document introuvable.</p>;

  const d = data.doc as Record<string, unknown>;
  const c = data.client as Record<string, unknown> | null;
  const isQuote = d["type"] === "devis";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/documents">
            <ArrowLeft className="size-4" /> Retour
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimer / PDF
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/documents/$id/edit" params={{ id }}>
              <Pencil className="size-4" /> Modifier
            </Link>
          </Button>
          {d["status"] === "brouillon" && (
            <Button size="sm" onClick={() => setStatus.mutate("envoye")}>
              <Send className="size-4" /> Marquer envoyé
            </Button>
          )}
          {!isQuote && d["status"] !== "paye" && (
            <Button size="sm" onClick={() => setStatus.mutate("paye")}>
              <CheckCircle2 className="size-4" /> Marquer payé
            </Button>
          )}
        </div>
      </div>

      {!premium && !isQuote && d["status"] !== "paye" && (
        <div className="no-print surface mt-4 flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span className="flex items-center gap-2">
            <Lock className="size-4 text-primary" /> Les relances automatiques sont réservées au Premium.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to="/premium">Découvrir</Link>
          </Button>
        </div>
      )}

      <div className="doc-sheet mt-6 p-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-display text-lg font-semibold">
              {profile?.company_name ?? profile?.full_name ?? "Mon entreprise"}
            </p>
            <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
              {[profile?.address, [profile?.postal_code, profile?.city].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join("\n")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[profile?.siret && `SIRET ${profile.siret}`, profile?.vat_number].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold uppercase">{isQuote ? "Devis" : "Facture"}</p>
            <p className="text-sm text-muted-foreground">{d["number"] as string}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Émis le {frDate(d["issue_date"] as string)}
            </p>
            {d["due_date"] ? (
              <p className="text-xs text-muted-foreground">
                {isQuote ? "Valable jusqu'au" : "Échéance"} {frDate(d["due_date"] as string)}
              </p>
            ) : null}
            <span
              className={`no-print mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
                d["status"] as DocStatus,
              )}`}
            >
              {STATUS_LABELS[d["status"] as DocStatus]}
            </span>
          </div>
        </div>

        {c && (
          <div className="mt-8 rounded-xl bg-muted p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
            <p className="mt-1 font-medium">{c["name"] as string}</p>
            <p className="text-xs text-muted-foreground">
              {[c["address"], [c["postal_code"], c["city"]].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join(" — ")}
            </p>
            {c["siret"] ? (
              <p className="text-xs text-muted-foreground">SIRET {c["siret"] as string}</p>
            ) : null}
          </div>
        )}

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2">Désignation</th>
              <th className="pb-2 text-right">Qté</th>
              <th className="pb-2 text-right">P.U. HT</th>
              <th className="pb-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id as string} className="border-b border-border/60">
                <td className="py-2.5">{it.description as string}</td>
                <td className="py-2.5 text-right">
                  {Number(it.quantity)} {it.unit as string}
                </td>
                <td className="py-2.5 text-right">{euro(Number(it.unit_price))}</td>
                <td className="py-2.5 text-right">{euro(Number(it.quantity) * Number(it.unit_price))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-full max-w-xs space-y-1 text-sm">
          {Number(d["discount"]) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Remise</span>
              <span>-{euro(Number(d["discount"]))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total HT</span>
            <span>{euro(Number(d["subtotal"]))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA {Number(d["vat_rate"])}%</span>
            <span>{euro(Number(d["vat_amount"]))}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold">
            <span>Total TTC</span>
            <span>{euro(Number(d["total"]))}</span>
          </div>
        </div>

        {d["notes"] ? (
          <p className="mt-8 whitespace-pre-line border-t border-border pt-4 text-xs text-muted-foreground">
            {d["notes"] as string}
          </p>
        ) : null}
        {profile?.vat_exempt && (
          <p className="mt-2 text-xs text-muted-foreground">
            TVA non applicable, art. 293 B du CGI.
          </p>
        )}
      </div>

      <PaymentsPanel documentId={id} total={Number(d["total"])} />
    </div>
  );
}
