export const FREE_CLIENT_LIMIT = 3;
export const FREE_DOCS_PER_MONTH = 5;

export function euro(n: number | null | undefined) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(n ?? 0));
}

export function frDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(d));
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type DocType = "devis" | "facture";
export type DocStatus =
  | "brouillon"
  | "envoye"
  | "accepte"
  | "refuse"
  | "paye"
  | "en_retard"
  | "annule";

export const STATUS_LABELS: Record<DocStatus, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  paye: "Payé",
  en_retard: "En retard",
  annule: "Annulé",
};

export function statusTone(status: DocStatus) {
  switch (status) {
    case "paye":
    case "accepte":
      return "bg-primary/12 text-primary";
    case "en_retard":
    case "refuse":
      return "bg-destructive/12 text-destructive";
    case "envoye":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function nextNumber(type: DocType, existing: string[]) {
  const prefix = type === "devis" ? "DEV" : "FAC";
  const year = new Date().getFullYear();
  const max = existing
    .filter((n) => n.startsWith(`${prefix}-${year}-`))
    .map((n) => parseInt(n.split("-")[2] ?? "0", 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
}

export type LineItem = {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

export function computeTotals(items: LineItem[], vatRate: number, discount: number) {
  const gross = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
  const subtotal = Math.max(0, gross - Number(discount || 0));
  const vat_amount = (subtotal * Number(vatRate || 0)) / 100;
  return {
    gross,
    subtotal,
    vat_amount,
    total: subtotal + vat_amount,
  };
}

export type Payment = {
  id: string;
  document_id: string;
  amount: number;
  paid_on: string;
  method: string;
  note: string | null;
};

export const PAYMENT_METHODS = [
  { value: "virement", label: "Virement" },
  { value: "carte", label: "Carte bancaire" },
  { value: "especes", label: "Espèces" },
  { value: "cheque", label: "Chèque" },
  { value: "autre", label: "Autre" },
] as const;

export function methodLabel(v: string) {
  return PAYMENT_METHODS.find((m) => m.value === v)?.label ?? v;
}

export function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Suivi de paiement d'un document : payé, reste à payer, état. */
export function paymentSummary(total: number, payments: { amount: number }[]) {
  const paid = round2(payments.reduce((s, p) => s + Number(p.amount || 0), 0));
  const due = round2(Math.max(0, Number(total || 0) - paid));
  const state: "non_paye" | "partiel" | "solde" =
    paid <= 0 ? "non_paye" : due <= 0 ? "solde" : "partiel";
  const ratio = Number(total) > 0 ? Math.min(1, paid / Number(total)) : paid > 0 ? 1 : 0;
  return { paid, due, state, ratio };
}

export const PAYMENT_STATE_LABELS: Record<"non_paye" | "partiel" | "solde", string> = {
  non_paye: "Non payé",
  partiel: "Partiellement payé",
  solde: "Soldé",
};

export function paymentStateTone(state: "non_paye" | "partiel" | "solde") {
  switch (state) {
    case "solde":
      return "bg-primary/12 text-primary";
    case "partiel":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}
