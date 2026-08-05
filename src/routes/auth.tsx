import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Connexion — Facturea" },
      { name: "description", content: "Connectez-vous à votre espace devis et factures Facturea." },
      { property: "og:title", content: "Connexion — Facturea" },
      { property: "og:description", content: "Accédez à vos devis, factures et clients." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Champs invalides");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        navigate({ to: "/settings" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Connexion Google impossible pour le moment");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-gradient hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 font-display text-lg font-bold text-white">
            F
          </span>
          <span className="font-display text-lg font-semibold text-white">Facturea</span>
        </div>
        <div>
          <h2 className="max-w-sm font-display text-3xl font-semibold text-white">
            Vos devis signés plus vite, vos factures payées à l'heure.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Rejoignez les indépendants qui pilotent leur facturation sans tableur.
          </p>
        </div>
        <p className="text-xs text-white/40">Données hébergées en Europe</p>
      </div>

      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold">
            {isSignup ? "Créer mon compte" : "Bon retour"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup
              ? "Gratuit, sans carte bancaire."
              : "Connectez-vous pour accéder à vos documents."}
          </p>

          {sent ? (
            <div className="surface mt-8 p-5 text-sm">
              Vérifiez votre boîte mail : un lien de confirmation vous attend pour activer votre
              compte.
            </div>
          ) : (
            <>
              <Button onClick={google} variant="outline" className="mt-8 w-full">
                Continuer avec Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                {isSignup && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={100}
                      placeholder="Camille Martin"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    placeholder="vous@exemple.fr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={72}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Un instant…" : isSignup ? "Créer mon compte" : "Se connecter"}
                </Button>
              </form>

              <button
                onClick={() => setIsSignup((v) => !v)}
                className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {isSignup ? "J'ai déjà un compte" : "Créer un compte gratuit"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
