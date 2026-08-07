import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  euro,
  frDate,
  methodLabel,
  paymentStateTone,
  paymentSummary,
  PAYMENT_METHODS,
  PAYMENT_STATE_LABELS,
  round2,
  type Payment,
} from "@/lib/billing";

type Props = { documentId: string; total: number };

export function PaymentsPanel({ documentId, total }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<string>("virement");
  const [note, setNote] = useState("");

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, document_id, amount, paid_on, method, note")
        .eq("document_id", documentId)
        .order("paid_on", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, amount: Number(p.amount) })) as Payment[];
    },
  });

  const summary = paymentSummary(total, payments);

  async function syncDocStatus(nextPaid: number) {
    const due = round2(Math.max(0, total - nextPaid));
    await supabase
      .from("documents")
      .update({
        ...(due <= 0 ? { status: "paye" as const, paid_at: new Date().toISOString() } : {}),
        ...(due > 0 ? { paid_at: null } : {}),
      })
      .eq("id", documentId);
  }

  const add = useMutation({
    mutationFn: async () => {
      const value = round2(Number(amount));
      if (!value || value <= 0) throw new Error("Saisissez un montant supérieur à 0.");
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("payments").insert({
        user_id: userData.user!.id,
        document_id: documentId,
        amount: value,
        paid_on: paidOn,
        method,
        note: note.trim() || null,
      });
      if (error) throw error;
      await syncDocStatus(summary.paid + value);
    },
    onSuccess: () => {
      toast.success("Paiement enregistré");
      setAmount("");
      setNote("");
      setOpen(false);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (p: Payment) => {
      const { error } = await supabase.from("payments").delete().eq("id", p.id);
      if (error) throw error;
      await syncDocStatus(summary.paid - p.amount);
    },
    onSuccess: () => {
      toast.success("Paiement supprimé");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="surface mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Wallet className="size-4 text-primary" /> Suivi des paiements
        </h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${paymentStateTone(summary.state)}`}
        >
          {PAYMENT_STATE_LABELS[summary.state]}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Montant du document" value={euro(total)} />
        <Stat label="Déjà payé" value={euro(summary.paid)} />
        <Stat label="Reste à payer" value={euro(summary.due)} strong />
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.round(summary.ratio * 100)}%` }}
        />
      </div>

      <div className="mt-5 divide-y divide-border rounded-xl border border-border">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {euro(p.amount)} · {methodLabel(p.method)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {frDate(p.paid_on)}
                {p.note ? ` — ${p.note}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="no-print"
              aria-label="Supprimer le paiement"
              onClick={() => remove.mutate(p)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
        {payments.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Aucun paiement enregistré.
          </p>
        )}
      </div>

      {open ? (
        <div className="no-print mt-4 space-y-4 rounded-xl bg-muted p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Montant (€)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                placeholder={String(summary.due || "")}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date du paiement</Label>
              <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Moyen de paiement</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Référence / note</Label>
              <Input
                value={note}
                maxLength={200}
                placeholder="Acompte, n° de chèque…"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => add.mutate()} disabled={add.isPending}>
              {add.isPending ? "Enregistrement…" : "Enregistrer le paiement"}
            </Button>
            {summary.due > 0 && (
              <Button variant="outline" onClick={() => setAmount(String(summary.due))}>
                Solder ({euro(summary.due)})
              </Button>
            )}
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button className="no-print mt-4" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Ajouter un paiement
        </Button>
      )}
    </section>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 ${strong ? "font-display text-lg font-semibold" : "text-sm font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
