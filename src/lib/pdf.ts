import { jsPDF } from "jspdf";
import { euro, frDate, legalMentions, type DocStatus } from "@/lib/billing";

export type PdfProfile = {
  company_name?: string | null;
  full_name?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  iban?: string | null;
  vat_exempt?: boolean | null;
  late_penalty_rate?: number | null;
  recovery_fee?: number | null;
  payment_terms_days?: number | null;
  legal_notes?: string | null;
};

export type PdfClient = {
  name?: string | null;
  contact_name?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  siret?: string | null;
  vat_number?: string | null;
};

export type PdfDoc = {
  type: "devis" | "facture";
  number: string;
  status: DocStatus;
  issue_date: string;
  due_date?: string | null;
  vat_rate: number;
  discount: number;
  subtotal: number;
  vat_amount: number;
  total: number;
  notes?: string | null;
};

export type PdfItem = {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

const M = 16; // marge en mm
const W = 210;
const CONTENT = W - M * 2;

/** Construit le PDF officiel du devis / de la facture. */
export function buildDocumentPdf(args: {
  doc: PdfDoc;
  items: PdfItem[];
  profile: PdfProfile | null | undefined;
  client: PdfClient | null | undefined;
}) {
  const { doc: d, items, profile, client } = args;
  const isQuote = d.type === "devis";
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.setFont("helvetica", "normal");

  let y = M + 4;

  // En-tête émetteur
  pdf.setFontSize(15);
  pdf.setFont("helvetica", "bold");
  pdf.text(profile?.company_name || profile?.full_name || "Mon entreprise", M, y);

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(110);
  let ly = y + 6;
  for (const line of [
    profile?.address,
    [profile?.postal_code, profile?.city].filter(Boolean).join(" "),
    [profile?.phone, profile?.email].filter(Boolean).join(" · "),
    [profile?.siret && `SIRET ${profile.siret}`, profile?.vat_number].filter(Boolean).join(" · "),
  ].filter((l) => l && String(l).trim())) {
    pdf.text(String(line), M, ly);
    ly += 4.5;
  }

  // Bloc titre à droite
  pdf.setTextColor(20);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text(isQuote ? "DEVIS" : "FACTURE", W - M, y + 1, { align: "right" });
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(110);
  pdf.text(d.number, W - M, y + 7, { align: "right" });
  pdf.setFontSize(9);
  pdf.text(`Émis le ${frDate(d.issue_date)}`, W - M, y + 13, { align: "right" });
  if (d.due_date) {
    pdf.text(
      `${isQuote ? "Valable jusqu'au" : "Échéance"} ${frDate(d.due_date)}`,
      W - M,
      y + 18,
      { align: "right" },
    );
  }

  y = Math.max(ly, y + 22) + 6;

  // Bloc client
  if (client) {
    const lines = [
      client.contact_name || null,
      client.address || null,
      [client.postal_code, client.city].filter(Boolean).join(" ") || null,
      client.siret ? `SIRET ${client.siret}` : null,
    ].filter((l) => l && String(l).trim()) as string[];
    const boxH = 12 + lines.length * 4.5;
    pdf.setFillColor(244, 246, 245);
    pdf.roundedRect(M + CONTENT / 2, y, CONTENT / 2, boxH, 2, 2, "F");
    pdf.setFontSize(8);
    pdf.setTextColor(130);
    pdf.text("CLIENT", M + CONTENT / 2 + 5, y + 6);
    pdf.setFontSize(10);
    pdf.setTextColor(20);
    pdf.setFont("helvetica", "bold");
    pdf.text(client.name || "—", M + CONTENT / 2 + 5, y + 11.5);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(110);
    let cy = y + 16;
    for (const l of lines) {
      pdf.text(l, M + CONTENT / 2 + 5, cy);
      cy += 4.5;
    }
    y += boxH + 8;
  }

  // Tableau des prestations
  const cols = { desc: M, qty: M + 100, pu: M + 128, tot: W - M };
  pdf.setFontSize(8);
  pdf.setTextColor(130);
  pdf.text("DÉSIGNATION", cols.desc, y);
  pdf.text("QTÉ", cols.qty, y, { align: "right" });
  pdf.text("P.U. HT", cols.pu, y, { align: "right" });
  pdf.text("TOTAL HT", cols.tot, y, { align: "right" });
  y += 2;
  pdf.setDrawColor(220);
  pdf.line(M, y, W - M, y);
  y += 5;

  pdf.setFontSize(9.5);
  pdf.setTextColor(20);
  for (const it of items) {
    const wrapped = pdf.splitTextToSize(it.description || "—", 92) as string[];
    if (y + wrapped.length * 4.6 > 250) {
      pdf.addPage();
      y = M + 6;
    }
    pdf.text(wrapped, cols.desc, y);
    pdf.text(`${Number(it.quantity)} ${it.unit ?? ""}`.trim(), cols.qty, y, { align: "right" });
    pdf.text(euro(Number(it.unit_price)), cols.pu, y, { align: "right" });
    pdf.text(euro(Number(it.quantity) * Number(it.unit_price)), cols.tot, y, { align: "right" });
    y += Math.max(wrapped.length * 4.6, 5) + 2.5;
    pdf.setDrawColor(238);
    pdf.line(M, y - 1.5, W - M, y - 1.5);
  }

  // Totaux
  y += 4;
  const tx = W - M - 60;
  const totalRow = (label: string, value: string, bold?: boolean) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(bold ? 11.5 : 9.5);
    pdf.setTextColor(bold ? 20 : 110);
    pdf.text(label, tx, y);
    pdf.setTextColor(20);
    pdf.text(value, W - M, y, { align: "right" });
    y += bold ? 7 : 5.5;
  };
  if (Number(d.discount) > 0) totalRow("Remise", `-${euro(Number(d.discount))}`);
  totalRow("Total HT", euro(Number(d.subtotal)));
  totalRow(`TVA ${Number(d.vat_rate)}%`, euro(Number(d.vat_amount)));
  pdf.setDrawColor(200);
  pdf.line(tx, y - 3, W - M, y - 3);
  y += 2;
  totalRow("Total TTC", euro(Number(d.total)), true);

  // Notes
  pdf.setFont("helvetica", "normal");
  if (d.notes?.trim()) {
    y += 4;
    pdf.setFontSize(9);
    pdf.setTextColor(90);
    const n = pdf.splitTextToSize(d.notes.trim(), CONTENT) as string[];
    pdf.text(n, M, y);
    y += n.length * 4.4 + 3;
  }

  // Mentions légales
  const mentions = legalMentions({
    isQuote,
    vatExempt: profile?.vat_exempt,
    penaltyRate: profile?.late_penalty_rate,
    recoveryFee: profile?.recovery_fee,
    paymentTermsDays: profile?.payment_terms_days,
    extra: profile?.legal_notes,
  });
  if (profile?.iban) mentions.push(`Règlement par virement — IBAN : ${profile.iban}`);

  y += 4;
  pdf.setDrawColor(220);
  pdf.line(M, y, W - M, y);
  y += 5;
  pdf.setFontSize(7.5);
  pdf.setTextColor(120);
  for (const m of mentions) {
    const w = pdf.splitTextToSize(m, CONTENT) as string[];
    if (y + w.length * 3.4 > 285) {
      pdf.addPage();
      y = M;
    }
    pdf.text(w, M, y);
    y += w.length * 3.4 + 1.6;
  }

  return pdf;
}

export function documentFileName(d: { type: string; number: string }) {
  return `${d.type === "devis" ? "Devis" : "Facture"}-${d.number}.pdf`.replace(/\s+/g, "-");
}
