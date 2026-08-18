import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { HOUR_OPTIONS, initialsFrom, minutesToLabel } from "@/lib/schedule";
import { useMutate, type ClinicSettings, type Therapist } from "@/lib/api";

type Row = { id?: string; name: string };

export function SettingsDialog({
  open,
  onOpenChange,
  therapists,
  settings,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  therapists: Therapist[];
  settings: ClinicSettings | null;
}) {
  const [list, setList] = useState<Row[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [dayStart, setDayStart] = useState(12 * 60);
  const [dayEnd, setDayEnd] = useState(24 * 60);
  const [saving, setSaving] = useState(false);

  const therapistMutate = useMutate("therapists", "therapist");
  const settingsMutate = useMutate("clinic_settings", "clinic_settings");

  useEffect(() => {
    if (!open) return;
    setList(therapists.map((t) => ({ id: t.id, name: t.name })));
    setRemoved([]);
    setDayStart(settings?.day_start ?? 12 * 60);
    setDayEnd(settings?.day_end ?? 24 * 60);
  }, [open, therapists, settings]);

  const valid = list.length > 0 && list.every((t) => t.name.trim()) && dayEnd > dayStart;

  const save = async () => {
    setSaving(true);
    try {
      for (const id of removed) {
        await therapistMutate.mutateAsync({ op: "update", id, values: { active: false } });
      }
      for (const [i, row] of list.entries()) {
        const name = row.name.trim();
        const values = { name, initials: initialsFrom(name), sort_order: i, active: true };
        if (row.id) await therapistMutate.mutateAsync({ op: "update", id: row.id, values });
        else await therapistMutate.mutateAsync({ op: "insert", values });
      }
      await settingsMutate.mutateAsync({
        op: "update",
        id: true,
        values: { day_start: dayStart, day_end: dayEnd },
      });
      toast.success("Settings saved");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Clinic settings</DialogTitle>
          <DialogDescription>
            Manage the doctors shown on the calendar and the working hours of the day.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Day starts</Label>
              <Select value={String(dayStart)} onValueChange={(v) => setDayStart(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.slice(0, 24).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {minutesToLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Day ends</Label>
              <Select value={String(dayEnd)} onValueChange={(v) => setDayEnd(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.filter((m) => m > dayStart).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m === 24 * 60 ? "12:00 AM (midnight)" : minutesToLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Doctors</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {list.map((t, i) => (
                <div key={t.id ?? `new-${i}`} className="flex items-center gap-2">
                  <Input
                    value={t.name}
                    placeholder="Dr. Full name"
                    onChange={(e) =>
                      setList((prev) =>
                        prev.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${t.name || "doctor"}`}
                    disabled={list.length === 1}
                    onClick={() => {
                      if (t.id) setRemoved((prev) => [...prev, t.id!]);
                      setList((prev) => prev.filter((_, xi) => xi !== i));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setList((prev) => [...prev, { name: "" }])}
              className="justify-self-start"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add doctor
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid || saving} onClick={save}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
