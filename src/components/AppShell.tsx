import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Sparkles,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/documents", label: "Devis & factures", icon: FileText },
  { to: "/settings", label: "Mon entreprise", icon: Settings },
  { to: "/premium", label: "Premium", icon: Sparkles },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="no-print hidden w-64 shrink-0 flex-col justify-between bg-sidebar p-4 lg:flex">
        <div>
          <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
            <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-display text-lg font-bold">
              F
            </span>
            <span className="font-display text-lg font-semibold text-sidebar-foreground">
              Facturea
            </span>
          </Link>
          {nav}
        </div>
        <div className="rounded-xl bg-sidebar-accent p-3">
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
            {profile?.company_name || profile?.full_name || "Mon entreprise"}
          </p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/60">
            {plan.isPremium
              ? `Premium · ${plan.cycleLabel}`
              : plan.expired
                ? "Premium expiré · plan gratuit"
                : "Plan gratuit"}
          </p>
          <button
            onClick={signOut}
            className="mt-3 flex items-center gap-2 text-xs text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
          >
            <LogOut className="size-3.5" /> Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              F
            </span>
            <span className="font-display font-semibold">Facturea</span>
          </Link>
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {open && (
          <div className="no-print bg-sidebar p-4 lg:hidden">
            {nav}
            <button
              onClick={signOut}
              className="mt-4 flex items-center gap-2 px-3 text-xs text-sidebar-foreground/70"
            >
              <LogOut className="size-3.5" /> Se déconnecter
            </button>
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
