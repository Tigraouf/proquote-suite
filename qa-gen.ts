import { buildDocumentPdf } from "@/lib/pdf";
const pdf = buildDocumentPdf({
  doc: { type: "facture", number: "FAC-2026-004", status: "envoye", issue_date: "2026-08-12", due_date: "2026-09-11", vat_rate: 20, discount: 50, subtotal: 1950, vat_amount: 390, total: 2340, notes: "Acompte de 30% à la commande, solde à la livraison. Merci de préciser la référence lors du virement." },
  items: [
    { description: "Pose de carrelage grès cérame, séjour et cuisine (préparation du support incluse)", quantity: 42, unit: "m²", unit_price: 38 },
    { description: "Déplacement", quantity: 1, unit: "forfait", unit_price: 90 },
    { description: "Main d'œuvre complémentaire", quantity: 8, unit: "h", unit_price: 45 },
  ],
  profile: { company_name: "Atelier Dubreuil", address: "12 rue des Écoles", postal_code: "69003", city: "Lyon", phone: "06 12 34 56 78", email: "contact@dubreuil.fr", siret: "812 345 678 00019", vat_number: "FR 12 812345678", iban: "FR76 3000 4000 0300 0012 3456 789", vat_exempt: false, late_penalty_rate: 10.75, recovery_fee: 40, payment_terms_days: 30, legal_notes: "Assurance décennale AXA n°123456 — couverture France entière." },
  client: { name: "SCI Bellevue", contact_name: "Mme Claire Rouché", address: "5 avenue Jean Jaurès", postal_code: "69007", city: "Lyon", siret: "509 876 543 00012" },
});
await Bun.write("/tmp/qa/out.pdf", pdf.output("arraybuffer"));
