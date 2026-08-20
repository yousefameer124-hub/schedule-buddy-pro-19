import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  APPOINTMENT_STATUSES,
  DURATION_OPTIONS,
  START_OPTIONS,
  minutesToLabel,
  type AppointmentStatus,
  type CalendarEvent,
} from "@/lib/schedule";
import type { AppointmentType, Patient, Therapist } from "@/lib/api";

export type Draft = {
  id?: string;
  patient_id: string | null;
  therapist_id: string;
  appointment_type_id: string | null;
  patient_package_id: string | null;
  date: string;
  start_minutes: number;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string;
};

export function AppointmentDialog({
  open,
  onOpenChange,
  draft,
  setDraft,
  patients,
  therapists,
  types,
  events,
  onSave,
  onDelete,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: Draft | null;
  setDraft: (d: Draft) => void;
  patients: Patient[];
  therapists: Therapist[];
  types: AppointmentType[];
  events: CalendarEvent[];
  onSave: (d: Draft) => void;
  onDelete: (id: string) => void;
  saving?: boolean;
}) {
  const therapist = therapists.find((t) => t.id === draft?.therapist_id);

  const conflict = useMemo(() => {
    if (!draft) return null;
    const end = draft.start_minutes + draft.duration_minutes;
    const clash = events.find(
      (e) =>
        e.id !== draft.id &&
        e.date === draft.date &&
        e.therapistId === draft.therapist_id &&
        e.status !== "cancelled" &&
        e.start < end &&
        draft.start_minutes < e.start + e.duration,
    );
    if (clash)
      return `${therapist?.name ?? "This doctor"} already has ${clash.title} at ${minutesToLabel(clash.start)}.`;
    if (therapist) {
      const day = new Date(`${draft.date}T00:00:00`).getDay();
      if (!(therapist.working_days ?? []).includes(day))
        return `${therapist.name} does not work on this weekday.`;
      if (draft.start_minutes < therapist.work_start || end > therapist.work_end)
        return `Outside ${therapist.name}'s hours (${minutesToLabel(therapist.work_start)} – ${minutesToLabel(therapist.work_end)}).`;
    }
    return null;
  }, [draft, events, therapist]);

  if (!draft) return null;
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit appointment" : "New appointment"}</DialogTitle>
          <DialogDescription>
            {minutesToLabel(draft.start_minutes)} ·{" "}
            {minutesToLabel(draft.start_minutes + draft.duration_minutes)} · {draft.date}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Patient</Label>
            <PatientPicker
              patients={patients}
              value={draft.patient_id}
              onChange={(v) => set({ patient_id: v })}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Doctor</Label>
              <Select value={draft.therapist_id} onValueChange={(v) => set({ therapist_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Session type</Label>
              <Select
                value={draft.appointment_type_id ?? "none"}
                onValueChange={(v) => {
                  const t = types.find((x) => x.id === v);
                  set({
                    appointment_type_id: v === "none" ? null : v,
                    duration_minutes: t?.duration_minutes ?? draft.duration_minutes,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unspecified</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="ap-date">Date</Label>
              <Input
                id="ap-date"
                type="date"
                value={draft.date}
                onChange={(e) => set({ date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Start</Label>
              <Select
                value={String(draft.start_minutes)}
                onValueChange={(v) => set({ start_minutes: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {START_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {minutesToLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <Select
                value={String(draft.duration_minutes)}
                onValueChange={(v) => set({ duration_minutes: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Attendance / status</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => set({ status: v as AppointmentStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_STATUSES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Completed sessions are deducted from the patient's package automatically.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ap-notes">Notes</Label>
            <Textarea
              id="ap-notes"
              rows={2}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Optional"
            />
          </div>

          {conflict && (
            <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {conflict}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {draft.id ? (
            <Button variant="destructive" onClick={() => onDelete(draft.id!)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onSave(draft)} disabled={!!conflict || saving}>
              {draft.id ? "Save changes" : "Book session"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PatientPicker({
  patients,
  value,
  onChange,
}: {
  patients: Patient[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = patients.find((p) => p.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? `${selected.full_name} · ${selected.code}` : "Blocked / internal slot"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase().trim()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Search name or phone…" />
          <CommandList>
            <CommandEmpty>No matching patient.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="blocked internal slot"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} />
                Blocked / internal slot
              </CommandItem>
              {patients.map((p) => (
                <CommandItem
                  key={p.id}
                  value={[p.full_name, p.code, p.phone ?? "", p.whatsapp ?? ""].join(" ")}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="flex flex-col">
                    <span>{p.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.code}
                      {p.phone ? ` · ${p.phone}` : ""}
                      {p.whatsapp && p.whatsapp !== p.phone ? ` · ${p.whatsapp}` : ""}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
