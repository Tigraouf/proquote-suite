import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  FileText,
  BellRing,
  Download,
  Users,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { TRADES } from "@/lib/trades";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Facturea — Devis & factures pour indépendants" },
      {
        name: "description",
        content:
          "Logiciel de devis, factures et gestion clients pour freelances, artisans et indépendants. Gratuit pour démarrer, Premium pour aller plus loin.",
      },
      { property: "og:title", content: "Facturea — Devis & factures pour indépendants" },
      {
        property: "og:description",
        content:
          "Créez vos devis et factures en 2 minutes, suivez vos paiements et relancez vos clients automatiquement.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileText,
    title: "Devis & factures conformes",
    text: "Numérotation automatique, TVA, mentions légales et conversion d'un devis en facture en un clic.",
  },
  {
    icon: Users,
    title: "Fichier clients",
    text: "Coordonnées, SIRET, historique des documents et chiffre d'affaires par client.",
  },
  {
    icon: BellRing,
    title: "Relances & paiements",
    text: "Repérez les factures en retard, marquez les paiements et relancez sans y penser.",
  },
  {
    icon: Download,
    title: "Export comptable",
    text: "Export CSV de vos factures et récapitulatif de TVA prêt pour votre comptable.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
            F
          </span>
          <span className="font-display text-lg font-semibold">Facturea</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Connexion</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ mode: "signup" }}>
              Commencer
            </Link>
          </Button>
        </div>
      </header>

      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <ShieldCheck className="size-3.5" /> Pensé pour les indépendants français
          </p>
          <h1 className="mt-6 max-w-2xl font-display text-4xl leading-[1.05] font-bold text-white sm:text-6xl">
            Vos devis et factures, réglés en deux minutes.
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/70 sm:text-lg">
            Artisan du bâtiment, paysagiste, photographe ou consultant : créez des documents
            impeccables, suivez vos clients et faites-vous payer plus vite.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Créer mon compte gratuit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#tarifs">Voir les tarifs</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-white/50">
            Sans carte bancaire · 5 documents et 3 clients offerts chaque mois
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Un outil calibré pour votre métier
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Choisissez votre activité à l'inscription : unités, prestations types et mentions sont
          pré-remplies.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {TRADES.map((t) => (
            <span
              key={t.id}
              className="surface px-4 py-2 text-sm font-medium"
            >
              <span className="mr-2">{t.emoji}</span>
              {t.label}
            </span>
          ))}
        </div>
      </section>

      <section className="soft-gradient border-y border-border">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-16 sm:grid-cols-2 sm:py-24">
          {FEATURES.map((f) => (
            <div key={f.title} className="surface p-6">
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="tarifs" className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">
          Gratuit pour démarrer, Premium pour accélérer
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="surface p-7">
            <p className="text-sm font-medium text-muted-foreground">Gratuit</p>
            <p className="mt-2 font-display text-4xl font-bold">0 €</p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "5 devis ou factures par mois",
                "3 clients enregistrés",
                "Fiche entreprise et métier",
                "Impression / PDF de vos documents",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-7 w-full">
              <Link to="/auth" search={{ mode: "signup" }}>
                Commencer gratuitement
              </Link>
            </Button>
          </div>

          <div className="surface border-primary/40 p-7 ring-1 ring-primary/20">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              Premium <Clock className="size-3.5" />
            </p>
            <p className="mt-2 font-display text-4xl font-bold">
              12 € <span className="text-base font-medium text-muted-foreground">/ mois</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Devis et factures illimités",
                "Clients illimités",
                "Relances et suivi des paiements",
                "Export comptable CSV + récap TVA",
                "Tableau de bord chiffre d'affaires",
              ].map((i) => (
                <li key={i} className="flex gap-2">
                  <Check className="size-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-7 w-full">
              <Link to="/auth" search={{ mode: "signup" }}>
                Essayer Premium
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Facturea · Devis, factures et gestion clients pour indépendants
      </footer>
    </div>
  );
}
