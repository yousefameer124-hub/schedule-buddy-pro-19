import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutate, useTherapists, type Patient } from "@/lib/api";

type Form = {
  code: string;
  full_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  medical_condition: string;
  notes: string;
  primary_therapist_id: string;
};

const empty: Form = {
  code: "",
  full_name: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  medical_condition: "",
  notes: "",
  primary_therapist_id: "",
};

export function PatientDialog({
  open,
  onOpenChange,
  patient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient?: Patient | null;
}) {
  const { data: therapists = [] } = useTherapists();
  const mutate = useMutate("patients", "patient");
  const [form, setForm] = useState<Form>(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      patient
        ? {
            code: patient.code ?? "",
            full_name: patient.full_name ?? "",
            phone: patient.phone ?? "",
            whatsapp: patient.whatsapp ?? "",
            email: patient.email ?? "",
            address: patient.address ?? "",
            medical_condition: patient.medical_condition ?? "",
            notes: patient.notes ?? "",
            primary_therapist_id: patient.primary_therapist_id ?? "",
          }
        : { ...empty, code: `P-${Date.now().toString().slice(-6)}` },
    );
  }, [open, patient]);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.full_name.trim()) {
      toast.error("Patient name is required");
      return;
    }
    const values = {
      code: form.code.trim() || `P-${Date.now().toString().slice(-6)}`,
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      address: form.address || null,
      medical_condition: form.medical_condition || null,
      notes: form.notes || null,
      primary_therapist_id: form.primary_therapist_id || null,
    };
    try {
      if (patient) await mutate.mutateAsync({ op: "update", id: patient.id, values });
      else await mutate.mutateAsync({ op: "insert", values });
      toast.success(patient ? "Patient updated" : "Patient added");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save patient");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{patient ? "Edit patient" : "Add patient"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => set("code")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => set("email")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Primary doctor</Label>
            <Select
              value={form.primary_therapist_id || "none"}
              onValueChange={(v) => set("primary_therapist_id")(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {therapists.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => set("address")(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Condition / diagnosis</Label>
            <Input
              value={form.medical_condition}
              onChange={(e) => set("medical_condition")(e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={mutate.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
