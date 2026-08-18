import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/api";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/calendar", label: "Calendar" },
  { to: "/patients", label: "Patients" },
  { to: "/therapists", label: "Therapists" },
  { to: "/packages", label: "Packages" },
  { to: "/financials", label: "Financials" },
  { to: "/whatsapp", label: "WhatsApp" },
  { to: "/settings", label: "Settings" },
  { to: "/audit", label: "Audit Log" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card md:flex">
        <div className="border-b px-4 py-4">
          <p className="text-sm font-semibold leading-tight">360 Physio Clinic</p>
          <p className="text-xs text-muted-foreground">ALREHAB</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm bg-accent font-medium text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">
          <p className="truncate">{user?.email}</p>
          <p className="capitalize">{role ?? "—"}</p>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 overflow-x-auto border-b bg-card px-2 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-md px-2 py-1 text-xs text-muted-foreground"
              activeProps={{ className: "whitespace-nowrap rounded-md px-2 py-1 text-xs bg-accent text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
        {children}
      </div>
      <Toaster />
    </div>
  );
}
