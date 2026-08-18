import { createFileRoute } from "@tanstack/react-router";
import { createFileRouteHead } from "@/lib/page-head";
import { useTherapists } from "@/lib/api";
import { minutesToLabel } from "@/lib/schedule";

export const Route = createFileRoute("/_authenticated/therapists")({
  head: createFileRouteHead("Therapists", "Clinic doctors, working hours and availability."),
  component: TherapistsPage,
});

function TherapistsPage() {
  const { data: therapists = [] } = useTherapists();
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Therapists</h1>
      <p className="text-sm text-muted-foreground">Manage doctors from Calendar → Settings.</p>
      <div className="mt-4 divide-y rounded-lg border bg-card">
        {therapists.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 text-sm">
            <span className="font-medium">{t.name}</span>
            <span className="text-muted-foreground">
              {minutesToLabel(t.work_start)} – {minutesToLabel(t.work_end)}
              {t.active ? "" : " · inactive"}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
