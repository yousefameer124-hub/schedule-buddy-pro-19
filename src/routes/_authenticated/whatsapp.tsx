import { createFileRoute } from "@tanstack/react-router";
import { createFileRouteHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/whatsapp")({
  head: createFileRouteHead("WhatsApp", "Patient WhatsApp messaging and reminder templates."),
  component: () => (
    <div className="p-6">
      <h1 className="text-xl font-semibold">WhatsApp</h1>
      <p className="mt-1 text-sm text-muted-foreground">Messaging templates and logs are coming soon.</p>
    </div>
  ),
});
