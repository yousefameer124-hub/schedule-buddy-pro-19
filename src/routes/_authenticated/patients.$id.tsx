import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { createFileRouteHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatientDialog } from "@/components/PatientDialog";
import { minutesToLabel } from "@/lib/schedule";
import {
  usePatient,
  usePatientAppointments,
  usePatientSessions,
  useTherapists,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  head: createFileRouteHead("Patient profile", "Patient details, appointments, packages and remaining sessions."),
  component: PatientProfile,
});

function PatientProfile() {
  const { id } = Route.useParams();
  const [open, setOpen] = useState(false);
  const { data: patient, isLoading } = usePatient(id);
  const { data: appts = [] } = usePatientAppointments(id);
  const { data: sessions = [] } = usePatientSessions(id);
  const { data: therapists = [] } = useTherapists();

  if (isLoading) return <main className="p-6 text-sm text-muted-foreground">Loading…</main>;
  if (!patient) return <main className="p-6 text-sm text-muted-foreground">Patient not found.</main>;

  const doctor = therapists.find((t) => t.id === patient.primary_therapist_id);
  const info: [string, string][] = [
    ["Code", patient.code],
    ["Phone", patient.phone ?? "—"],
    ["WhatsApp", patient.whatsapp ?? "—"],
    ["Email", patient.email ?? "—"],
    ["Address", patient.address ?? "—"],
    ["Condition", patient.medical_condition ?? "—"],
    ["Assigned doctor", doctor?.name ?? "Unassigned"],
    ["Notes", patient.notes ?? "—"],
  ];

  return (
    <main className="p-6">
      <Link to="/patients" className="text-xs text-muted-foreground hover:underline">
        ← Back to patients
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{patient.full_name}</h1>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Edit
        </Button>
      </div>

      <section className="mt-4 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
        {info.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm">{value}</p>
          </div>
        ))}
      </section>

      <h2 className="mt-6 text-sm font-semibold">Packages & sessions</h2>
      <div className="mt-2 divide-y rounded-lg border bg-card">
        {sessions.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No packages yet.</p>
        )}
        {sessions.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <span className="font-medium">{s.name}</span>
            <span className="text-muted-foreground">
              {s.sessions_completed}/{s.total_sessions} done · {s.sessions_cancelled} cancelled ·{" "}
              {s.sessions_missed} missed
            </span>
            <Badge variant={s.active ? "default" : "secondary"}>
              {s.sessions_remaining ?? 0} remaining
            </Badge>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-sm font-semibold">Appointments</h2>
      <div className="mt-2 divide-y rounded-lg border bg-card">
        {appts.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No appointments yet.</p>
        )}
        {appts.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3 text-sm">
            <span>
              {a.date} · {minutesToLabel(a.start_minutes)}
            </span>
            <span className="text-muted-foreground">
              {therapists.find((t) => t.id === a.therapist_id)?.name ?? "—"} · {a.status}
            </span>
          </div>
        ))}
      </div>

      <PatientDialog open={open} onOpenChange={setOpen} patient={patient} />
    </main>
  );
}
