import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { createFileRouteHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BillingDialog } from "@/components/BillingDialog";
import {
  computeFinalTotal,
  computeRemaining,
  money,
  PARTNER_LABELS,
} from "@/lib/schedule";
import {
  useAuth,
  useClinicSettings,
  usePatientPackages,
  usePatients,
  type PatientPackage,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/financials")({
  head: createFileRouteHead(
    "Financials",
    "Patient billing and outstanding balances — admin only.",
  ),
  beforeLoad: async ({ context }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: role, error } = await supabase.rpc("bootstrap_current_user", {
      _full_name: (data.user.user_metadata as { full_name?: string })?.full_name ?? data.user.email ?? "Staff",
    });
    if (error || role !== "admin") throw redirect({ to: "/calendar" });
  },
  component: FinancialsPage,
});

function FinancialsPage() {
  const { isAdmin } = useAuth();
  const { data: patients = [] } = usePatients();
  const { data: settings } = useClinicSettings();
  const { data: packages = [], isLoading } = usePatientPackages(undefined, isAdmin);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PatientPackage | null>(null);

  const patientName = (id: string) => patients.find((p) => p.id === id)?.full_name ?? "—";
  const currency = settings?.currency;

  const totals = packages.reduce(
    (acc, pkg) => {
      const final = computeFinalTotal(
        pkg.examination_fee,
        pkg.session_price,
        pkg.total_sessions,
        pkg.discount,
      );
      const remaining = computeRemaining(
        pkg.examination_fee,
        pkg.session_price,
        pkg.total_sessions,
        pkg.discount,
        pkg.amount_paid,
      );
      acc.paid += pkg.amount_paid;
      acc.outstanding += remaining;
      acc.final += final;
      return acc;
    },
    { paid: 0, outstanding: 0, final: 0 },
  );

  function add() {
    setEditing(null);
    setOpen(true);
  }

  function edit(pkg: PatientPackage) {
    setEditing(pkg);
    setOpen(true);
  }

  if (!isAdmin) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Financials</h1>
          <p className="text-sm text-muted-foreground">
            Patient billing and outstanding balances.
          </p>
        </div>
        <Button onClick={add}>
          <Plus className="mr-1 h-4 w-4" /> New billing record
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total paid</p>
          <p className="text-2xl font-semibold">{money(totals.paid, currency)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total outstanding</p>
          <p className="text-2xl font-semibold">{money(totals.outstanding, currency)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total billed</p>
          <p className="text-2xl font-semibold">{money(totals.final, currency)}</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Patient</th>
              <th className="p-3">Package</th>
              <th className="p-3 text-center">Sessions</th>
              <th className="p-3 text-right">Final total</th>
              <th className="p-3 text-right">Discount</th>
              <th className="p-3 text-right">Amount paid</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3">Payment date</th>
              <th className="p-3">Method</th>
              <th className="p-3">Partner</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={11}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && packages.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={11}>
                  No billing records yet.
                </td>
              </tr>
            )}
            {packages.map((pkg) => {
              const final = computeFinalTotal(
                pkg.examination_fee,
                pkg.session_price,
                pkg.total_sessions,
                pkg.discount,
              );
              const remaining = computeRemaining(
                pkg.examination_fee,
                pkg.session_price,
                pkg.total_sessions,
                pkg.discount,
                pkg.amount_paid,
              );
              const partnerLabel = PARTNER_LABELS.find((p) => p.id === pkg.partner)?.label ?? "None";
              return (
                <tr key={pkg.id} className="hover:bg-accent/40">
                  <td className="p-3 font-medium">{patientName(pkg.patient_id)}</td>
                  <td className="p-3">{pkg.name}</td>
                  <td className="p-3 text-center">{pkg.total_sessions}</td>
                  <td className="p-3 text-right">{money(final, currency)}</td>
                  <td className="p-3 text-right">{money(pkg.discount, currency)}</td>
                  <td className="p-3 text-right">{money(pkg.amount_paid, currency)}</td>
                  <td className="p-3 text-right font-medium">
                    {remaining > 0 ? (
                      <Badge variant="destructive">{money(remaining, currency)}</Badge>
                    ) : (
                      <Badge variant="secondary">Settled</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{pkg.payment_date ?? "—"}</td>
                  <td className="p-3 capitalize">{pkg.payment_method}</td>
                  <td className="p-3">{partnerLabel}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => edit(pkg)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <BillingDialog open={open} onOpenChange={setOpen} pkg={editing} />
    </main>
  );
}
