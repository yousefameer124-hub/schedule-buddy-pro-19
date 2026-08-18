import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { createFileRouteHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientDialog } from "@/components/PatientDialog";
import { usePatients, useTherapists, type Patient } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/patients/")({
  head: createFileRouteHead("Patients", "Search, add and manage clinic patient records."),
  component: PatientsPage,
});

function PatientsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const { data: patients = [], isLoading } = usePatients(search);
  const { data: therapists = [] } = useTherapists();
  const doctorName = (id: string | null) => therapists.find((t) => t.id === id)?.name ?? "—";

  return (
    <main className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Patients</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Add patient
        </Button>
      </div>

      <div className="relative mt-4 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search name, code, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Doctor</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && patients.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  No patients found.
                </td>
              </tr>
            )}
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-accent/40">
                <td className="p-3 text-muted-foreground">{p.code}</td>
                <td className="p-3 font-medium">
                  <Link to="/patients/$id" params={{ id: p.id }} className="hover:underline">
                    {p.full_name}
                  </Link>
                </td>
                <td className="p-3">{p.phone ?? "—"}</td>
                <td className="p-3">{doctorName(p.primary_therapist_id)}</td>
                <td className="p-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PatientDialog open={open} onOpenChange={setOpen} patient={editing} />
    </main>
  );
}
