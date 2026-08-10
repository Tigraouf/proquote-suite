import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Lock, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { usePlan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FREE_CLIENT_LIMIT, euro } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({
    meta: [
      { title: "Clients — Facturea" },
      { name: "description", content: "Gérez votre fichier clients : coordonnées, SIRET et historique." },
      { property: "og:title", content: "Clients — Facturea" },
      { property: "og:description", content: "Votre fichier clients centralisé." },
    ],
  }),
  component: ClientsPage,
});

type ClientRow = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  siret: string | null;
  vat_number: string | null;
  notes: string | null;
  is_company: boolean;
};

const emptyClient = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  postal_code: "",
  city: "",
  siret: "",
  vat_number: "",
  notes: "",
  is_company: true,
};

const clientSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire").max(120),
  email: z.string().trim().max(255).email("E-mail invalide").or(z.literal("")),
  phone: z.string().trim().max(30),
  notes: z.string().trim().max(1000),
});

function ClientsPage() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const premium = usePlan().isPremium;
  const [open, setOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);

  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [form, setForm] = useState({ ...emptyClient });

  const { data } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const [clients, docs] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("documents").select("client_id, total, type, status"),
      ]);
      if (clients.error) throw clients.error;
      if (docs.error) throw docs.error;
      return { clients: (clients.data ?? []) as unknown as ClientRow[], docs: docs.data ?? [] };
    },
  });

  const clients = data?.clients ?? [];
  const docs = data?.docs ?? [];
  const atLimit = !premium && clients.length >= FREE_CLIENT_LIMIT;

  const save = useMutation({
    mutationFn: async () => {
      const parsed = clientSchema.safeParse({
        name: form.name,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        ...form,
        name: form.name.trim(),
        user_id: userData.user!.id,
      };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Client mis à jour" : "Client ajouté");
      setOpen(false);
      setEditing(null);
      setForm({ ...emptyClient });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client supprimé");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    if (atLimit) {
      setLockOpen(true);
      return;
    }
    setEditing(null);
    setForm({ ...emptyClient });
    setOpen(true);
  }


  function openEdit(c: ClientRow) {
    setEditing(c);
    setForm({
      name: c.name,
      contact_name: c.contact_name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      postal_code: c.postal_code ?? "",
      city: c.city ?? "",
      siret: c.siret ?? "",
      vat_number: c.vat_number ?? "",
      notes: c.notes ?? "",
      is_company: c.is_company,
    });
    setOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {premium
              ? `${clients.length} client(s) · illimité`
              : `${clients.length}/${FREE_CLIENT_LIMIT} clients (plan gratuit)`}
          </p>
        </div>
        <Button onClick={openNew}>
          {atLimit ? <Lock className="size-4" /> : <Plus className="size-4" />} Nouveau client
        </Button>
      </div>

      <PremiumLockDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        title="Limite de clients atteinte"
        description={`Le plan gratuit est limité à ${FREE_CLIENT_LIMIT} clients. Passez en Premium pour gérer un carnet d'adresses illimité.`}
      />


      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {clients.map((c) => {
          const ca = docs
            .filter((d) => d.client_id === c.id && d.type === "facture" && d.status === "paye")
            .reduce((s, d) => s + Number(d.total), 0);
          return (
            <div key={c.id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {c.is_company ? (
                      <Building2 className="size-4 shrink-0 text-primary" />
                    ) : (
                      <User className="size-4 shrink-0 text-primary" />
                    )}
                    {c.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {[c.email, c.phone].filter(Boolean).join(" · ") || "Aucun contact renseigné"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {[c.postal_code, c.city].filter(Boolean).join(" ")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Modifier">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove.mutate(c.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Encaissé : <span className="font-medium text-foreground">{euro(ca)}</span>
              </p>
            </div>
          );
        })}
        {clients.length === 0 && (
          <p className="surface col-span-full px-5 py-12 text-center text-sm text-muted-foreground">
            Ajoutez votre premier client pour commencer à facturer.
          </p>
        )}
      </div>

      {!premium && (
        <p className="mt-6 text-xs text-muted-foreground">
          Le plan Premium débloque un nombre illimité de clients.
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            <DialogDescription>Ces informations apparaîtront sur vos documents.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm">Client professionnel</span>
              <Switch
                checked={form.is_company}
                onCheckedChange={(v) => setForm({ ...form, is_company: v })}
              />
            </div>
            <Field label="Nom / raison sociale" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Contact"
              value={form.contact_name}
              onChange={(v) => setForm({ ...form, contact_name: v })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Code postal"
                value={form.postal_code}
                onChange={(v) => setForm({ ...form, postal_code: v })}
              />
              <Field label="Ville" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            </div>
            {form.is_company && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SIRET" value={form.siret} onChange={(v) => setForm({ ...form, siret: v })} />
                <Field
                  label="N° TVA"
                  value={form.vat_number}
                  onChange={(v) => setForm({ ...form, vat_number: v })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} maxLength={255} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
