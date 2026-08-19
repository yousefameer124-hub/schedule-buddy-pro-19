import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Plus,
  Settings,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TimelineGrid, type Row } from "@/components/TimelineGrid";
import { AppointmentDialog, type Draft } from "@/components/AppointmentDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import {
  APPOINTMENT_STATUSES,
  DEFAULT_DAY_END,
  DEFAULT_DAY_START,
  DEFAULT_DURATION,
  buildTicks,
  dateKey,
  minutesToLabel,
  statusBadge,
  weekDays,
  type AppointmentStatus,
  type CalendarEvent,
} from "@/lib/schedule";
import {
  useAppointmentTypes,
  useAppointments,
  useClinicSettings,
  useMutate,
  usePatients,
  useTherapists,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const TITLE = "360 Physio Clinic ALREHAB — Scheduling Calendar";
const DESC =
  "Odoo-style scheduling calendar for 360 Physio Clinic ALREHAB in New Cairo: book physiotherapy and sports-injury sessions per doctor by day or week.";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(today);
  const [view, setView] = useState<"day" | "week">("week");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [therapistFilter, setTherapistFilter] = useState<string | "all">("all");

  const days = useMemo(() => weekDays(anchor), [anchor]);
  const range = useMemo(
    () =>
      view === "week"
        ? { from: dateKey(days[0]!), to: dateKey(days[6]!) }
        : { from: dateKey(anchor), to: dateKey(anchor) },
    [view, days, anchor],
  );

  const { data: therapists = [] } = useTherapists();
  const { data: patients = [] } = usePatients();
  const { data: types = [] } = useAppointmentTypes();
  const { data: settings } = useClinicSettings();
  const { data: rowsData = [] } = useAppointments(range.from, range.to);
  const mutate = useMutate("appointments", "appointment");

  const config = {
    dayStart: settings?.day_start ?? DEFAULT_DAY_START,
    dayEnd: settings?.day_end ?? DEFAULT_DAY_END,
  };

  const events: CalendarEvent[] = useMemo(
    () =>
      rowsData.map((a) => {
        const type = types.find((t) => t.id === a.appointment_type_id);
        return {
          id: a.id,
          title: a.patients?.full_name ?? a.title ?? "Appointment",
          patientId: a.patient_id,
          therapistId: a.therapist_id,
          color: type?.color ?? "physio",
          status: a.status,
          typeName: type?.name ?? "Session",
          date: a.date,
          start: a.start_minutes,
          duration: a.duration_minutes,
        };
      }),
    [rowsData, types],
  );

  const visible = useMemo(
    () =>
      therapistFilter === "all"
        ? events
        : events.filter((e) => e.therapistId === therapistFilter),
    [events, therapistFilter],
  );

  const activeTherapists = useMemo(
    () =>
      therapistFilter === "all" ? therapists : therapists.filter((t) => t.id === therapistFilter),
    [therapists, therapistFilter],
  );

  const ticksForDay = (d: Date) => {
    const key = dateKey(d);
    const extras = visible.filter((a) => a.date === key).map((a) => a.start);
    return buildTicks(config.dayStart, config.dayEnd, extras);
  };

  const rowsForDay = (d: Date): Row[] => {
    const key = dateKey(d);
    return activeTherapists.map((t) => ({
      id: `${key}|${t.id}`,
      label: t.name,
      appointments: visible.filter((a) => a.date === key && a.therapistId === t.id),
    }));
  };

  const countForDay = (d: Date) => visible.filter((a) => a.date === dateKey(d)).length;

  const nowMinutes = today.getHours() * 60 + today.getMinutes();
  const nowFor = (d: Date) => (isSameDay(d, today) ? nowMinutes : undefined);

  const openSlot = (rowId: string, minutes: number) => {
    const [date, therapistId] = rowId.split("|");
    const tid = therapistId ?? therapists[0]?.id;
    if (!tid) {
      toast.error("Add a doctor in settings first");
      return;
    }
    setDraft({
      patient_id: null,
      therapist_id: tid,
      appointment_type_id: types[0]?.id ?? null,
      patient_package_id: null,
      date: date ?? dateKey(anchor),
      start_minutes: minutes,
      duration_minutes: settings?.default_duration ?? DEFAULT_DURATION,
      status: "scheduled" as AppointmentStatus,
      notes: "",
    });
    setOpen(true);
  };

  const openEvent = (e: CalendarEvent) => {
    const row = rowsData.find((a) => a.id === e.id);
    if (!row) return;
    setDraft({
      id: row.id,
      patient_id: row.patient_id,
      therapist_id: row.therapist_id,
      appointment_type_id: row.appointment_type_id,
      patient_package_id: row.patient_package_id,
      date: row.date,
      start_minutes: row.start_minutes,
      duration_minutes: row.duration_minutes,
      status: row.status,
      notes: row.notes ?? "",
    });
    setOpen(true);
  };

  const save = (d: Draft) => {
    const values = {
      patient_id: d.patient_id,
      therapist_id: d.therapist_id,
      appointment_type_id: d.appointment_type_id,
      patient_package_id: d.patient_package_id,
      date: d.date,
      start_minutes: d.start_minutes,
      duration_minutes: d.duration_minutes,
      status: d.status,
      notes: d.notes || null,
    };
    mutate.mutate(d.id ? { op: "update", id: d.id, values } : { op: "insert", values }, {
      onSuccess: () => {
        toast.success(d.id ? "Appointment updated" : "Appointment booked");
        setOpen(false);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const remove = (id: string) => {
    mutate.mutate(
      { op: "delete", id },
      {
        onSuccess: () => {
          toast.success("Appointment removed");
          setOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const step = (dir: 1 | -1) => setAnchor((prev) => addDays(prev, view === "week" ? 7 * dir : dir));

  const rangeLabel =
    view === "week"
      ? `${format(days[0]!, "d MMM")} – ${format(days[6]!, "d MMM yyyy")}`
      : format(anchor, "EEEE, d MMMM yyyy");

  const dayCount = visible.filter((a) => a.date === dateKey(anchor)).length;
  const weekCount = visible.filter((a) => days.some((d) => dateKey(d) === a.date)).length;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">
              {settings?.clinic_name ?? "360 Physio Clinic — ALREHAB"}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-event-sports" /> 5.0 · Physical
                therapy clinic in New Cairo
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{" "}
                {settings?.address ?? "Ahmed Ben Hanbal, Second New Cairo"}
              </span>
              <a href="tel:01148008620" className="flex items-center gap-1 hover:text-foreground">
                <Phone className="h-3.5 w-3.5" /> {settings?.phone ?? "011 48008620"}
              </a>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {minutesToLabel(config.dayStart)} –{" "}
                {minutesToLabel(config.dayEnd % (24 * 60))}
              </span>
            </p>
          </div>
          <Badge variant="secondary" className="font-medium">
            Sports injury management &amp; rehabilitation
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setAnchor(today)}>
              Today
            </Button>
            <h2 className="ml-2 flex items-center gap-2 text-base font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              {rangeLabel}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border p-0.5">
              {(["day", "week"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded px-3 py-1 text-sm capitalize transition-colors",
                    view === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              onClick={() =>
                openSlot(
                  `${dateKey(anchor)}|${activeTherapists[0]?.id ?? ""}`,
                  config.dayStart,
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New appointment
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTherapistFilter("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              therapistFilter === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            All doctors
          </button>
          {therapists.map((t) => (
            <button
              key={t.id}
              onClick={() => setTherapistFilter(t.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                therapistFilter === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              )}
            >
              {t.name}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {view === "week" ? `${weekCount} sessions this week` : `${dayCount} sessions today`}
          </span>
        </div>

        {view === "day" ? (
          <TimelineGrid
            rows={rowsForDay(anchor)}
            ticks={ticksForDay(anchor)}
            dayEnd={config.dayEnd}
            now={nowFor(anchor)}
            onSlotClick={openSlot}
            onEventClick={openEvent}
          />
        ) : (
          <div className="space-y-5">
            {days.map((d) => (
              <section key={dateKey(d)}>
                <h3
                  className={cn(
                    "mb-1.5 flex items-center gap-2 text-sm font-semibold",
                    isSameDay(d, today) && "text-primary",
                  )}
                >
                  {format(d, "EEEE d MMM")}
                  {isSameDay(d, today) && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                      Today
                    </span>
                  )}
                  <span className="text-xs font-normal text-muted-foreground">
                    {countForDay(d)} session{countForDay(d) === 1 ? "" : "s"}
                  </span>
                </h3>
                <TimelineGrid
                  rows={rowsForDay(d)}
                  ticks={ticksForDay(d)}
                  dayEnd={config.dayEnd}
                  now={nowFor(d)}
                  onSlotClick={openSlot}
                  onEventClick={openEvent}
                />
              </section>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {APPOINTMENT_STATUSES.map((s) => (
            <span
              key={s.id}
              className={cn("rounded-full px-2 py-0.5 font-medium", statusBadge(s.id))}
            >
              {s.mark} {s.label}
            </span>
          ))}
        </div>
      </main>

      <AppointmentDialog
        open={open}
        onOpenChange={setOpen}
        draft={draft}
        setDraft={setDraft}
        patients={patients}
        therapists={therapists}
        types={types}
        events={events}
        onSave={save}
        onDelete={remove}
        saving={mutate.isPending}
      />

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        therapists={therapists}
        settings={settings ?? null}
      />
    </div>
  );
}
