import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutate, usePackages, usePatients, type PatientPackage } from "@/lib/api";

type Form = {
  patient_id: string;
  package_id: string;
  name: string;
  total_sessions: number;
  start_date: string;
  end_date: string;
};

const empty: Form = {
  patient_id: "",
  package_id: "none",
  name: "",
  total_sessions: 1,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
};

export function PackageDialog({
  open,
  onOpenChange,
  pkg,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pkg?: PatientPackage | null;
}) {
  const { data: patients = [] } = usePatients();
  const { data: templates = [] } = usePackages();
  const mutate = useMutate("patient_packages", "patient_package");
  const [form, setForm] = useState<Form>(empty);

  useEffect(() => {
    if (!open) return;
    if (pkg) {
      setForm({
        patient_id: pkg.patient_id,
        package_id: pkg.package_id ?? "none",
        name: pkg.name ?? "",
        total_sessions: pkg.total_sessions,
        start_date: pkg.start_date ?? new Date().toISOString().slice(0, 10),
        end_date: pkg.end_date ?? "",
      });
    } else {
      setForm({ ...empty, start_date: new Date().toISOString().slice(0, 10) });
    }
  }, [open, pkg]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  function pickTemplate(id: string) {
    if (id === "none") {
      set({ package_id: "none" });
      return;
    }
    const t = templates.find((x) => x.id === id);
    set({
      package_id: id,
      name: t?.name ?? form.name,
      total_sessions: t?.sessions ?? form.total_sessions,
    });
  }

  async function save() {
    if (!form.patient_id) {
      toast.error("Select a patient");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (form.total_sessions < 1) {
      toast.error("Sessions must be at least 1");
      return;
    }
    const values = {
      patient_id: form.patient_id,
      package_id: form.package_id === "none" ? null : form.package_id,
      name: form.name.trim(),
      total_sessions: form.total_sessions,
      start_date: form.start_date,
      end_date: form.end_date || null,
    };
    try {
      if (pkg) await mutate.mutateAsync({ op: "update", id: pkg.id, values });
      else await mutate.mutateAsync({ op: "insert", values });
      toast.success(pkg ? "Package updated" : "Package created");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save package");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pkg ? "Edit package" : "New package"}</DialogTitle>
          <DialogDescription>
            Assign a session package to a patient. Completed appointments deduct one session automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Patient</Label>
            <Select
              value={form.patient_id || "none"}
              onValueChange={(v) => set({ patient_id: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none" disabled>
                  Select patient
                </SelectItem>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name} · {p.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Package template</Label>
            <Select value={form.package_id} onValueChange={pickTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Custom (no template)</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.sessions} sessions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pkg-name">Package name</Label>
            <Input
              id="pkg-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pkg-sessions">Sessions</Label>
              <Input
                id="pkg-sessions"
                type="number"
                min={1}
                value={form.total_sessions}
                onChange={(e) => set({ total_sessions: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pkg-start">Start</Label>
              <Input
                id="pkg-start"
                type="date"
                value={form.start_date}
                onChange={(e) => set({ start_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pkg-end">Expiry</Label>
              <Input
                id="pkg-end"
                type="date"
                value={form.end_date}
                onChange={(e) => set({ end_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={mutate.isPending}>
            {pkg ? "Save changes" : "Create package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
