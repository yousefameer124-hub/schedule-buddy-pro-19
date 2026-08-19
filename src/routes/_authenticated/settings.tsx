import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createFileRouteHead } from "@/lib/page-head";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useClinicSettings, useTherapists } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/settings")({
  head: createFileRouteHead("Settings", "Manage clinic hours and therapists."),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: therapists = [] } = useTherapists();
  const { data: settings } = useClinicSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {settings?.clinic_name ?? "Clinic"} — {therapists.length} therapists
      </p>
      <Button className="mt-4" onClick={() => setOpen(true)}>
        Open clinic settings
      </Button>
      <SettingsDialog
        open={open}
        onOpenChange={setOpen}
        therapists={therapists}
        settings={settings}
      />
    </div>
  );
}
