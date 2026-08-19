import { createFileRoute } from "@tanstack/react-router";
import { createFileRouteHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/audit")({
  head: createFileRouteHead("Audit Log", "Record of staff actions across the clinic system."),
  component: () => (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Audit Log</h1>
      <p className="mt-1 text-sm text-muted-foreground">Activity history is coming soon.</p>
    </div>
  ),
});
