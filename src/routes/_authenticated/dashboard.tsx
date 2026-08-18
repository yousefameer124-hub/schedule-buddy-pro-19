import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { createFileRouteHead } from "@/lib/page-head";
import { dateKey, minutesToLabel } from "@/lib/schedule";
import { useAppointments, usePatients, useTherapists } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: createFileRouteHead("Dashboard", "Today's sessions and clinic overview."),
  component: Dashboard,
});

function Dashboard() {
  const today = dateKey(new Date());
  const { data: appts = [] } = useAppointments(today, today);
  const { data: patients = [] } = usePatients();
  const { data: therapists = [] } = useTherapists();

  const stats = [
    { label: "Today's appointments", value: appts.length },
    { label: "Active doctors", value: therapists.filter((t) => t.active).length },
    { label: "Patients", value: patients.length },
  ];

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-6 text-sm font-semibold">Today's schedule</h2>
      <div className="mt-2 divide-y rounded-lg border bg-card">
        {appts.length === 0 && <p className="p-4 text-sm text-muted-foreground">No appointments today.</p>}
        {appts.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3 text-sm">
            <span>{a.patients?.full_name ?? a.title ?? "Appointment"}</span>
            <span className="text-muted-foreground">
              {minutesToLabel(a.start_minutes)} · {a.status}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
