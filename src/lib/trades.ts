export type Trade = {
  id: string;
  label: string;
  emoji: string;
  defaultUnit: string;
  sampleItems: string[];
};

export const TRADES: Trade[] = [
  {
    id: "btp",
    label: "BTP & artisans du bâtiment",
    emoji: "🧱",
    defaultUnit: "m²",
    sampleItems: ["Fourniture et pose", "Main d'œuvre", "Évacuation des gravats"],
  },
  {
    id: "paysagiste",
    label: "Paysagiste & jardinier",
    emoji: "🌿",
    defaultUnit: "m²",
    sampleItems: ["Tonte et entretien", "Taille de haie", "Création de massif"],
  },
  {
    id: "mecanicien",
    label: "Mécanicien à domicile",
    emoji: "🔧",
    defaultUnit: "h",
    sampleItems: ["Main d'œuvre atelier", "Révision complète", "Pièces détachées"],
  },
  {
    id: "photo",
    label: "Photographe / vidéaste",
    emoji: "📸",
    defaultUnit: "j",
    sampleItems: ["Journée de reportage", "Post-production", "Cession de droits"],
  },
  {
    id: "coach",
    label: "Coach & formateur",
    emoji: "🎯",
    defaultUnit: "h",
    sampleItems: ["Séance individuelle", "Atelier collectif", "Programme 3 mois"],
  },
  {
    id: "consultant",
    label: "Consultant",
    emoji: "📊",
    defaultUnit: "j",
    sampleItems: ["Journée de conseil", "Audit", "Accompagnement mensuel"],
  },
  {
    id: "numerique",
    label: "Métiers du numérique",
    emoji: "💻",
    defaultUnit: "j",
    sampleItems: ["Développement", "Design d'interface", "Maintenance mensuelle"],
  },
  {
    id: "services",
    label: "Services à la personne",
    emoji: "🏡",
    defaultUnit: "h",
    sampleItems: ["Heure de prestation", "Forfait hebdomadaire", "Déplacement"],
  },
  {
    id: "nettoyage",
    label: "Nettoyage professionnel",
    emoji: "🧽",
    defaultUnit: "m²",
    sampleItems: ["Nettoyage de locaux", "Vitrerie", "Remise en état"],
  },
  {
    id: "evenementiel",
    label: "Événementiel",
    emoji: "🎪",
    defaultUnit: "j",
    sampleItems: ["Coordination jour J", "Location de matériel", "Régie technique"],
  },
  {
    id: "maintenance",
    label: "Réparation & maintenance",
    emoji: "🛠️",
    defaultUnit: "h",
    sampleItems: ["Diagnostic", "Intervention sur site", "Contrat d'entretien"],
  },
  {
    id: "multiservices",
    label: "Indépendant multiservices",
    emoji: "🧰",
    defaultUnit: "h",
    sampleItems: ["Prestation horaire", "Forfait chantier", "Déplacement"],
  },
];

export const LEGAL_FORMS = [
  "Micro-entreprise",
  "EI (Entreprise individuelle)",
  "EURL",
  "SASU",
  "SARL",
  "SAS",
  "Profession libérale",
];

export function tradeById(id?: string | null) {
  return TRADES.find((t) => t.id === id);
}
