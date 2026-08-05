import { createFileRoute, useParams } from "@tanstack/react-router";
import { DocumentEditor } from "@/components/DocumentEditor";

export const Route = createFileRoute("/_authenticated/documents/$id/edit")({
  head: () => ({
    meta: [
      { title: "Modifier le document — Facturea" },
      { name: "description", content: "Modifiez les lignes, montants et statut de votre document." },
      { property: "og:title", content: "Modifier le document — Facturea" },
      { property: "og:description", content: "Ajustez votre devis ou facture." },
    ],
  }),
  component: EditDoc,
});

function EditDoc() {
  const { id } = useParams({ from: "/_authenticated/documents/$id/edit" });
  return <DocumentEditor documentId={id} />;
}
