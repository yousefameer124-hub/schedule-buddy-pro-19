import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
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
  DAY_END,
  DAY_START,
  SESSION_TYPES,
  SLOT,
  THERAPISTS,
  minutesToLabel,
  type Appointment,
  type SessionType,
} from "@/lib/schedule";

export type Draft = Omit<Appointment, "id"> & { id?: string };

const slotOptions = Array.from(
  { length: (DAY_END - DAY_START) / SLOT },
  (_, i) => DAY_START + i * SLOT,
);

const durations = [30, 45, 60, 90, 120];

export function AppointmentDialog({
  draft,
  open,
  onOpenChange,
  onSave,
  onDelete,
  conflict,
}: {
  draft: Draft | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (d: Draft) => void;
  onDelete: (id: string) => void;
  conflict: (d: Draft) => boolean;
}) {
  const [value, setValue] = useState<Draft | null>(draft);

  useEffect(() => setValue(draft), [draft]);

  if (!value) return null;

  const clash = conflict(value);
  const isNew = !value.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "New appointment" : "Edit appointment"}</DialogTitle>
          <DialogDescription>
            {format(new Date(`${value.date}T00:00:00`), "EEEE, d MMMM yyyy")} ·{" "}
            {minutesToLabel(value.start)} – {minutesToLabel(value.start + value.duration)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="patient">Patient / subject</Label>
            <Input
              id="patient"
              value={value.patient}
              placeholder="e.g. Ahmed Selim"
              onChange={(e) => setValue({ ...value, patient: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Start</Label>
              <Select
                value={String(value.start)}
                onValueChange={(v) => setValue({ ...value, start: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slotOptions.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {minutesToLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Duration</Label>
              <Select
                value={String(value.duration)}
                onValueChange={(v) => setValue({ ...value, duration: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Therapist</Label>
              <Select
                value={value.therapistId}
                onValueChange={(v) => setValue({ ...value, therapistId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THERAPISTS.map((t) => (
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
                value={value.type}
                onValueChange={(v) => setValue({ ...value, type: v as SessionType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={value.phone ?? ""}
              placeholder="011 48008620"
              onChange={(e) => setValue({ ...value, phone: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Notes</Label>
            <Textarea
              id="note"
              rows={2}
              value={value.note ?? ""}
              placeholder="Injury, referral, treatment plan…"
              onChange={(e) => setValue({ ...value, note: e.target.value })}
            />
          </div>

          {clash && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              This therapist already has a session in that time range.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          {!isNew ? (
            <Button variant="ghost" onClick={() => onDelete(value.id!)}>
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
            <Button
              disabled={clash || value.patient.trim().length === 0}
              onClick={() => onSave(value)}
            >
              {isNew ? "Book session" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
