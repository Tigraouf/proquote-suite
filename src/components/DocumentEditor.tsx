import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addDays,
  computeTotals,
  euro,
  nextNumber,
  FREE_DOCS_PER_MONTH,
  type DocStatus,
  type DocType,
  type LineItem,
} from "@/lib/billing";
import { tradeById } from "@/lib/trades";

type Props = { documentId?: string };

export function DocumentEditor({ documentId }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const premium = profile?.plan === "premium";
  const trade = tradeById(profile?.trade);

  const [type, setType] = useState<DocType>("devis");
  const [clientId, setClientId] = useState<string>("");
  const [status, setStatus] = useState<DocStatus>("brouillon");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [vatRate, setVatRate] = useState(20);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit: "u", unit_price: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data } = useQuery({
    queryKey: ["editor-context", documentId ?? "new"],
    queryFn: async () => {
      const [clients, docs] = await Promise.all([
        supabase.from("clients").select("id, name").order("name"),
        supabase.from("documents").select("id, number, issue_date"),
      ]);
      if (clients.error) throw clients.error;
      if (docs.error) throw docs.error;
      let existing = null;
      let existingItems: LineItem[] = [];
      if (documentId) {
        const doc = await supabase.from("documents").select("*").eq("id", documentId).maybeSingle();
        if (doc.error) throw doc.error;
        existing = doc.data;
        const its = await supabase
          .from("document_items")
          .select("*")
          .eq("document_id", documentId)
          .order("position");
        if (its.error) throw its.error;
        existingItems = (its.data ?? []).map((i) => ({
          description: i.description as string,
          quantity: Number(i.quantity),
          unit: i.unit as string,
          unit_price: Number(i.unit_price),
        }));
      }
      return { clients: clients.data ?? [], docs: docs.data ?? [], existing, existingItems };
    },
  });

  useEffect(() => {
    if (!data || loaded) return;
    if (data.existing) {
      const e = data.existing as Record<string, unknown>;
      setType(e["type"] as DocType);
      setClientId((e["client_id"] as string) ?? "");
      setStatus(e["status"] as DocStatus);
      setNumber(e["number"] as string);
      setIssueDate(e["issue_date"] as string);
      setDueDate((e["due_date"] as string) ?? "");
      setVatRate(Number(e["vat_rate"]));
      setDiscount(Number(e["discount"]));
      setNotes((e["notes"] as string) ?? "");
      if (data.existingItems.length) setItems(data.existingItems);
    } else {
      setNumber(nextNumber("devis", data.docs.map((d) => d.number as string)));
      setVatRate(profile?.vat_exempt ? 0 : Number(profile?.vat_rate ?? 20));
      setDueDate(addDays(new Date(), profile?.payment_terms_days ?? 30));
      if (trade) {
        setItems([{ description: "", quantity: 1, unit: trade.defaultUnit, unit_price: 0 }]);
      }
    }
    setLoaded(true);
  }, [data, loaded, profile, trade]);

  useEffect(() => {
    if (!loaded || documentId || !data) return;
    setNumber(nextNumber(type, data.docs.map((d) => d.number as string)));
  }, [type, loaded, documentId, data]);

  const totals = useMemo(() => computeTotals(items, vatRate, discount), [items, vatRate, discount]);
  const monthCount = (data?.docs ?? []).filter((d) => {
    const dt = new Date(d.issue_date as string);
    const now = new Date();
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  }).length;
  const blocked = !documentId && !premium && monthCount >= FREE_DOCS_PER_MONTH;

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function save() {
    if (blocked) {
      toast.error(`Plan gratuit : ${FREE_DOCS_PER_MONTH} documents par mois maximum.`);
      return;
    }
    if (!items.some((i) => i.description.trim())) {
      toast.error("Ajoutez au moins une ligne de prestation.");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user!.id;
      const payload = {
        user_id: uid,
        client_id: clientId || null,
        type,
        number: number.trim(),
        status,
        issue_date: issueDate,
        due_date: dueDate || null,
        vat_rate: vatRate,
        discount,
        subtotal: totals.subtotal,
        vat_amount: totals.vat_amount,
        total: totals.total,
        notes: notes.trim() || null,
        paid_at: status === "paye" ? new Date().toISOString() : null,
      };

      let id = documentId;
      if (id) {
        const { error } = await supabase.from("documents").update(payload).eq("id", id);
        if (error) throw error;
        await supabase.from("document_items").delete().eq("document_id", id);
      } else {
        const { data: inserted, error } = await supabase
          .from("documents")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        id = inserted.id as string;
      }

      const rows = items
        .filter((i) => i.description.trim())
        .map((i, idx) => ({
          document_id: id!,
          user_id: uid,
          description: i.description.trim().slice(0, 500),
          quantity: Number(i.quantity) || 0,
          unit: i.unit,
          unit_price: Number(i.unit_price) || 0,
          position: idx,
        }));
      const { error: itemsError } = await supabase.from("document_items").insert(rows);
      if (itemsError) throw itemsError;

      qc.invalidateQueries();
      toast.success("Document enregistré");
      navigate({ to: "/documents/$id", params: { id: id! } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">
        {documentId ? "Modifier le document" : "Nouveau document"}
      </h1>

      {blocked && (
        <div className="surface mt-5 border-destructive/30 p-4 text-sm">
          Vous avez atteint la limite gratuite de {FREE_DOCS_PER_MONTH} documents ce mois-ci. Passez
          en Premium pour continuer.
        </div>
      )}

      <div className="surface mt-6 space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DocType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="devis">Devis</SelectItem>
                <SelectItem value="facture">Facture</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Numéro</Label>
            <Input value={number} maxLength={40} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un client" />
              </SelectTrigger>
              <SelectContent>
                {(data?.clients ?? []).map((c) => (
                  <SelectItem key={c.id as string} value={c.id as string}>
                    {c.name as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DocStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                {type === "devis" ? (
                  <>
                    <SelectItem value="accepte">Accepté</SelectItem>
                    <SelectItem value="refuse">Refusé</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="paye">Payé</SelectItem>
                    <SelectItem value="en_retard">En retard</SelectItem>
                  </>
                )}
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date d'émission</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{type === "devis" ? "Validité jusqu'au" : "Échéance"}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="surface mt-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Prestations</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((a) => [
                ...a,
                { description: "", quantity: 1, unit: trade?.defaultUnit ?? "u", unit_price: 0 },
              ])
            }
          >
            <Plus className="size-4" /> Ligne
          </Button>
        </div>

        {trade && (
          <div className="mt-3 flex flex-wrap gap-2">
            {trade.sampleItems.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setItems((a) => [
                    ...a,
                    { description: s, quantity: 1, unit: trade.defaultUnit, unit_price: 0 },
                  ])
                }
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                + {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_70px_70px_110px_40px]">
              <Input
                placeholder="Description de la prestation"
                value={it.description}
                maxLength={500}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={it.quantity}
                onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
              />
              <Input
                value={it.unit}
                maxLength={8}
                onChange={(e) => updateItem(idx, { unit: e.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                value={it.unit_price}
                onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setItems((a) => a.filter((_, i) => i !== idx))}
                aria-label="Supprimer la ligne"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Remise (€)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>TVA (%)</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-6 space-y-1.5">
          <Label>Notes / conditions</Label>
          <Textarea
            value={notes}
            maxLength={1000}
            placeholder="Acompte de 30% à la commande, solde à la livraison…"
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="mt-6 rounded-xl bg-muted p-4 text-sm">
          <Row label="Total HT" value={euro(totals.subtotal)} />
          <Row label={`TVA ${vatRate}%`} value={euro(totals.vat_amount)} />
          <Row label="Total TTC" value={euro(totals.total)} strong />
        </div>

        <Button className="mt-6 w-full" onClick={save} disabled={saving || blocked}>
          {saving ? "Enregistrement…" : "Enregistrer le document"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${strong ? "font-display text-base font-semibold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
