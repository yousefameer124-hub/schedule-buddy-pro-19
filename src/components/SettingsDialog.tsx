import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  HOUR_OPTIONS,
  initialsFrom,
  minutesToLabel,
  type ClinicConfig,
  type Therapist,
} from "@/lib/schedule";

export function SettingsDialog({
  open,
  onOpenChange,
  therapists,
  config,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  therapists: Therapist[];
  config: ClinicConfig;
  onSave: (therapists: Therapist[], config: ClinicConfig) => void;
}) {
  const [list, setList] = useState<Therapist[]>(therapists);
  const [draftConfig, setDraftConfig] = useState<ClinicConfig>(config);

  useEffect(() => {
    if (open) {
      setList(therapists);
      setDraftConfig(config);
    }
  }, [open, therapists, config]);

  const addDoctor = () =>
    setList((prev) => [
      ...prev,
      { id: `t${Date.now().toString(36)}`, name: "", initials: "DR" },
    ]);

  const valid =
    list.length > 0 &&
    list.every((t) => t.name.trim().length > 0) &&
    draftConfig.dayEnd > draftConfig.dayStart;

  const save = () =>
    onSave(
      list.map((t) => ({
        ...t,
        name: t.name.trim(),
        initials: initialsFrom(t.name.trim()),
      })),
      draftConfig,
    );

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
              <Select
                value={String(draftConfig.dayStart)}
                onValueChange={(v) => setDraftConfig((c) => ({ ...c, dayStart: Number(v) }))}
              >
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
              <Select
                value={String(draftConfig.dayEnd)}
                onValueChange={(v) => setDraftConfig((c) => ({ ...c, dayEnd: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.filter((m) => m > draftConfig.dayStart).map((m) => (
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
                <div key={t.id} className="flex items-center gap-2">
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
                    onClick={() => setList((prev) => prev.filter((_, xi) => xi !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addDoctor} className="justify-self-start">
              <Plus className="mr-2 h-4 w-4" />
              Add doctor
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={save}>
            Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
