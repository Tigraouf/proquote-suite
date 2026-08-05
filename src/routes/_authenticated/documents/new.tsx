import { createFileRoute } from "@tanstack/react-router";
import { DocumentEditor } from "@/components/DocumentEditor";

export const Route = createFileRoute("/_authenticated/documents/new")({
  head: () => ({
    meta: [
      { title: "Nouveau devis — Facturea" },
      { name: "description", content: "Créez un devis ou une facture conforme en quelques secondes." },
      { property: "og:title", content: "Nouveau devis — Facturea" },
      { property: "og:description", content: "Rédigez vos documents commerciaux en un instant." },
    ],
  }),
  component: () => <DocumentEditor />,
});
