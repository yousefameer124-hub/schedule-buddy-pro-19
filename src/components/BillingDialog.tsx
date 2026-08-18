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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PARTNERS,
  PARTNER_LABELS,
  PAYMENT_METHODS,
  computeFinalTotal,
  computeRemaining,
  computeSubtotal,
  money,
  type Partner,
  type PaymentMethod,
} from "@/lib/schedule";
import { useClinicSettings, useMutate, usePatients, type PatientPackage } from "@/lib/api";

type Form = {
  patient_id: string;
  name: string;
  total_sessions: number;
  examination_fee: number;
  session_price: number;
  discount: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_date: string;
  partner: Partner;
  billing_notes: string;
  start_date: string;
  end_date: string;
};

const emptyForm = (defaultExamFee: number): Form => ({
  patient_id: "",
  name: "",
  total_sessions: 1,
  examination_fee: defaultExamFee,
  session_price: 0,
  discount: 0,
  amount_paid: 0,
  payment_method: "cash",
  payment_date: new Date().toISOString().slice(0, 10),
  partner: "none",
  billing_notes: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
});

export function BillingDialog({
  open,
  onOpenChange,
  pkg,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pkg?: PatientPackage | null;
}) {
  const { data: patients = [] } = usePatients();
  const { data: settings } = useClinicSettings();
  const mutate = useMutate("patient_packages", "patient_package");
  const [form, setForm] = useState<Form>(emptyForm(0));

  useEffect(() => {
    if (!open) return;
    if (pkg) {
      setForm({
        patient_id: pkg.patient_id,
        name: pkg.name ?? "",
        total_sessions: pkg.total_sessions,
        examination_fee: pkg.examination_fee ?? 0,
        session_price: pkg.session_price ?? 0,
        discount: pkg.discount ?? 0,
        amount_paid: pkg.amount_paid ?? 0,
        payment_method: pkg.payment_method ?? "cash",
        payment_date: pkg.payment_date ?? new Date().toISOString().slice(0, 10),
        partner: (pkg.partner as Partner) ?? "none",
        billing_notes: pkg.billing_notes ?? "",
        start_date: pkg.start_date ?? new Date().toISOString().slice(0, 10),
        end_date: pkg.end_date ?? "",
      });
    } else {
      setForm(emptyForm(settings?.default_examination_fee ?? 0));
    }
  }, [open, pkg, settings]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  function onPartnerChange(p: Partner) {
    if (p === "fibers" || p === "shefit") {
      set({ partner: p, examination_fee: 0 });
    } else {
      set({ partner: p, examination_fee: settings?.default_examination_fee ?? 0 });
    }
  }

  const subtotal = computeSubtotal(form.examination_fee, form.session_price, form.total_sessions);
  const finalTotal = computeFinalTotal(
    form.examination_fee,
    form.session_price,
    form.total_sessions,
    form.discount,
  );
  const remaining = computeRemaining(
    form.examination_fee,
    form.session_price,
    form.total_sessions,
    form.discount,
    form.amount_paid,
  );

  const valid =
    form.patient_id &&
    form.total_sessions >= 1 &&
    form.examination_fee >= 0 &&
    form.session_price >= 0 &&
    form.discount >= 0 &&
    form.amount_paid >= 0 &&
    finalTotal >= 0 &&
    remaining >= 0;

  async function save() {
    if (!form.patient_id) {
      toast.error("Select a patient");
      return;
    }
    const values = {
      patient_id: form.patient_id,
      name: form.name.trim() || "Session package",
      total_sessions: form.total_sessions,
      examination_fee: form.examination_fee,
      session_price: form.session_price,
      discount: form.discount,
      amount_paid: form.amount_paid,
      payment_method: form.payment_method,
      payment_date: form.payment_date || null,
      partner: form.partner,
      billing_notes: form.billing_notes || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      active: true,
    };
    try {
      if (pkg) await mutate.mutateAsync({ op: "update", id: pkg.id, values });
      else await mutate.mutateAsync({ op: "insert", values });
      toast.success(pkg ? "Billing updated" : "Billing record created");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save billing");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pkg ? "Edit billing" : "New billing record"}</DialogTitle>
          <DialogDescription>
            Create a billing record for a patient's session package.
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
            <Label htmlFor="bill-name">Package name</Label>
            <Input
              id="bill-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Session package"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Partner</Label>
              <Select value={form.partner} onValueChange={(v) => onPartnerChange(v as Partner)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_LABELS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bill-sessions">Sessions</Label>
              <Input
                id="bill-sessions"
                type="number"
                min={1}
                value={form.total_sessions}
                onChange={(e) => set({ total_sessions: Math.max(1, Number(e.target.value)) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="bill-exam">Examination fee</Label>
              <Input
                id="bill-exam"
                type="number"
                min={0}
                value={form.examination_fee}
                onChange={(e) => set({ examination_fee: Math.max(0, Number(e.target.value)) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bill-price">Session price</Label>
              <Input
                id="bill-price"
                type="number"
                min={0}
                value={form.session_price}
                onChange={(e) => set({ session_price: Math.max(0, Number(e.target.value)) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="bill-discount">Discount</Label>
              <Input
                id="bill-discount"
                type="number"
                min={0}
                value={form.discount}
                onChange={(e) => set({ discount: Math.max(0, Number(e.target.value)) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bill-paid">Amount paid</Label>
              <Input
                id="bill-paid"
                type="number"
                min={0}
                value={form.amount_paid}
                onChange={(e) => set({ amount_paid: Math.max(0, Number(e.target.value)) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Payment method</Label>
              <Select
                value={form.payment_method}
                onValueChange={(v) => set({ payment_method: v as PaymentMethod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bill-date">Payment date</Label>
              <Input
                id="bill-date"
                type="date"
                value={form.payment_date}
                onChange={(e) => set({ payment_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bill-notes">Notes</Label>
            <Textarea
              id="bill-notes"
              rows={2}
              value={form.billing_notes}
              onChange={(e) => set({ billing_notes: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="font-medium">{money(subtotal, settings?.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Final total</p>
              <p className="font-medium">{money(finalTotal, settings?.currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-medium">{money(remaining, settings?.currency)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid || mutate.isPending}>
            {pkg ? "Save changes" : "Create record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
