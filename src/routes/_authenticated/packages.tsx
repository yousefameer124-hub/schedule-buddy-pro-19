import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { createFileRouteHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageDialog } from "@/components/PackageDialog";
import { useAuth, usePatientPackages, usePatients, type PatientPackage } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/packages")({
  head: createFileRouteHead(
    "Packages",
    "Patient session packages: total, completed and remaining sessions.",
  ),
  component: PackagesPage,
});

function PackagesPage() {
  const { isDesk } = useAuth();
  const { data: patients = [] } = usePatients();
  const { data: packages = [], isLoading } = usePatientPackages(undefined, isDesk);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PatientPackage | null>(null);

  const patientName = (id: string) =>
    patients.find((p) => p.id === id)?.full_name ?? "—";

  function add() {
    setEditing(null);
    setOpen(true);
  }

  function edit(pkg: PatientPackage) {
    setEditing(pkg);
    setOpen(true);
  }

  return (
    <main className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Packages</h1>
          <p className="text-sm text-muted-foreground">
            Session packages track total, completed and remaining sessions per patient.
          </p>
        </div>
        {isDesk && (
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" /> New package
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Patient</th>
              <th className="p-3">Package</th>
              <th className="p-3 text-center">Total</th>
              <th className="p-3 text-center">Completed</th>
              <th className="p-3 text-center">Remaining</th>
              <th className="p-3">Start</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Status</th>
              {isDesk && <th className="p-3" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={isDesk ? 9 : 8}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && packages.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={isDesk ? 9 : 8}>
                  No packages yet.
                </td>
              </tr>
            )}
            {packages.map((pkg) => {
              const remaining = pkg.sessions_remaining ?? pkg.total_sessions - pkg.sessions_completed;
              const expired = pkg.end_date ? new Date(pkg.end_date) < new Date() : false;
              const status = !pkg.active
                ? "Inactive"
                : expired
                  ? "Expired"
                  : remaining <= 0
                    ? "Used up"
                    : "Active";
              return (
                <tr key={pkg.id} className="hover:bg-accent/40">
                  <td className="p-3 font-medium">{patientName(pkg.patient_id)}</td>
                  <td className="p-3">{pkg.name}</td>
                  <td className="p-3 text-center">{pkg.total_sessions}</td>
                  <td className="p-3 text-center">{pkg.sessions_completed}</td>
                  <td className="p-3 text-center font-medium">{remaining}</td>
                  <td className="p-3 text-muted-foreground">{pkg.start_date ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{pkg.end_date ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={status === "Active" ? "default" : "secondary"}>{status}</Badge>
                  </td>
                  {isDesk && (
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => edit(pkg)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isDesk && <PackageDialog open={open} onOpenChange={setOpen} pkg={editing} />}
    </main>
  );
}
