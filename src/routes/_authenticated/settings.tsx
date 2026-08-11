import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRADES } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres entreprise — Facturea" },
      { name: "description", content: "Renseignez SIRET, TVA, métier et conditions de paiement." },
      { property: "og:title", content: "Paramètres entreprise — Facturea" },
      { property: "og:description", content: "Configurez votre identité de facturation." },
    ],
  }),
  component: Settings,
});

const schema = z.object({
  full_name: z.string().trim().max(120),
  company_name: z.string().trim().max(160),
  siret: z.string().trim().max(20),
});

function Settings() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    trade: "",
    siret: "",
    vat_number: "",
    address: "",
    postal_code: "",
    city: "",
    phone: "",
    website: "",
    iban: "",
    vat_exempt: false,
    vat_rate: 20,
    payment_terms_days: 30,
    late_penalty_rate: 10.75,
    recovery_fee: 40,
    legal_notes: "",
  });


  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      company_name: profile.company_name ?? "",
      trade: profile.trade ?? "",
      siret: profile.siret ?? "",
      vat_number: profile.vat_number ?? "",
      address: profile.address ?? "",
      postal_code: profile.postal_code ?? "",
      city: profile.city ?? "",
      phone: profile.phone ?? "",
      website: profile.website ?? "",
      iban: profile.iban ?? "",
      vat_exempt: profile.vat_exempt ?? false,
      vat_rate: Number(profile.vat_rate ?? 20),
      payment_terms_days: profile.payment_terms_days ?? 30,
      late_penalty_rate: Number(profile.late_penalty_rate ?? 10.75),
      recovery_fee: Number(profile.recovery_fee ?? 40),
      legal_notes: profile.legal_notes ?? "",

    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("profiles").update(form).eq("id", userData.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paramètres enregistrés");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold sm:text-3xl">Paramètres</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ces informations sont reprises automatiquement sur vos devis et factures.
      </p>

      <div className="surface mt-6 space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold">Identité</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Nom complet" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} />
          <F
            label="Nom de l'entreprise"
            v={form.company_name}
            on={(v) => setForm({ ...form, company_name: v })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Métier</Label>
          <Select value={form.trade} onValueChange={(v) => setForm({ ...form, trade: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un métier" />
            </SelectTrigger>
            <SelectContent>
              {TRADES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Téléphone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
        </div>
      </div>

      <div className="surface mt-5 space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold">Coordonnées & mentions légales</h2>
        <F label="Adresse" v={form.address} on={(v) => setForm({ ...form, address: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Code postal" v={form.postal_code} on={(v) => setForm({ ...form, postal_code: v })} />
          <F label="Ville" v={form.city} on={(v) => setForm({ ...form, city: v })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="SIRET" v={form.siret} on={(v) => setForm({ ...form, siret: v })} />
          <F label="N° TVA intracom." v={form.vat_number} on={(v) => setForm({ ...form, vat_number: v })} />
        </div>
        <F label="Site web" v={form.website} on={(v) => setForm({ ...form, website: v })} />
      </div>

      <div className="surface mt-5 space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold">Facturation</h2>
        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <span className="text-sm">Franchise en base de TVA (art. 293 B)</span>
          <Switch
            checked={form.vat_exempt}
            onCheckedChange={(v) => setForm({ ...form, vat_exempt: v, vat_rate: v ? 0 : 20 })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Taux de TVA par défaut (%)</Label>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={form.vat_rate}
              disabled={form.vat_exempt}
              onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Délai de paiement (jours)</Label>
            <Input
              type="number"
              min={0}
              value={form.payment_terms_days}
              onChange={(e) => setForm({ ...form, payment_terms_days: Number(e.target.value) })}
            />
          </div>
        </div>
        <F label="IBAN (affiché sur les factures)" v={form.iban} on={(v) => setForm({ ...form, iban: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Pénalités de retard (% / an)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.late_penalty_rate}
              onChange={(e) => setForm({ ...form, late_penalty_rate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Indemnité de recouvrement (€)</Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={form.recovery_fee}
              onChange={(e) => setForm({ ...form, recovery_fee: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Mentions complémentaires</Label>
          <Textarea
            value={form.legal_notes}
            maxLength={600}
            placeholder="Assurance décennale n°…, médiateur de la consommation, RCS…"
            onChange={(e) => setForm({ ...form, legal_notes: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Les mentions légales obligatoires (pénalités, indemnité 40 €, franchise de TVA) sont ajoutées
            automatiquement au bas de vos factures.
          </p>
        </div>
        <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>

      </div>
    </div>
  );
}

function F({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={v} maxLength={200} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
