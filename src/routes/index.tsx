import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Plus,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TimelineGrid, type Row } from "@/components/TimelineGrid";
import { AppointmentDialog, type Draft } from "@/components/AppointmentDialog";
import {
  ATTENDANCE_STATUSES,
  DAY_START,
  DEFAULT_DURATION,
  SESSION_TYPES,
  THERAPISTS,
  dateKey,
  minutesToLabel,
  seedAppointments,
  statusBadge,
  typeClass,
  weekDays,
  type Appointment,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";

const TITLE = "360 Physio Clinic ALREHAB — Scheduling Calendar";
const DESC =
  "Odoo-style scheduling calendar for 360 Physio Clinic ALREHAB in New Cairo: book physiotherapy and sports-injury sessions per therapist by day or week.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "physio360-appointments";

function Index() {
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(today);
  const [view, setView] = useState<"day" | "week">("week");
  const [appointments, setAppointments] = useState<Appointment[]>(() => seedAppointments(today));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [open, setOpen] = useState(false);
  const [therapistFilter, setTherapistFilter] = useState<string | "all">("all");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setAppointments(JSON.parse(raw) as Appointment[]);
      } catch {
        /* ignore corrupt storage */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  const visible = useMemo(
    () =>
      therapistFilter === "all"
        ? appointments
        : appointments.filter((a) => a.therapistId === therapistFilter),
    [appointments, therapistFilter],
  );

  const days = useMemo(() => weekDays(anchor), [anchor]);

  const activeTherapists = useMemo(
    () =>
      therapistFilter === "all" ? THERAPISTS : THERAPISTS.filter((t) => t.id === therapistFilter),
    [therapistFilter],
  );

  const rowsForDay = (d: Date): Row[] => {
    const key = dateKey(d);
    return activeTherapists.map((t) => ({
      id: `${key}|${t.id}`,
      label: t.name,
      sublabel: "Physiotherapist",
      appointments: visible.filter((a) => a.date === key && a.therapistId === t.id),
    }));
  };

  const openSlot = (rowId: string, minutes: number) => {
    const [date, therapistId] = rowId.split("|");
    setDraft({
      patient: "",
      therapistId: therapistId ?? THERAPISTS[0]!.id,
      type: "physio",
      date: date ?? dateKey(anchor),
      start: minutes,
      duration: DEFAULT_DURATION,
      status: "scheduled",
    });
    setOpen(true);
  };

  const openEvent = (a: Appointment) => {
    setDraft(a);
    setOpen(true);
  };

  const save = (d: Draft) => {
    if (d.id) {
      setAppointments((prev) => prev.map((a) => (a.id === d.id ? ({ ...d } as Appointment) : a)));
      toast.success("Appointment updated");
    } else {
      setAppointments((prev) => [
        ...prev,
        { ...d, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` } as Appointment,
      ]);
      toast.success(`Booked ${d.patient} at ${minutesToLabel(d.start)}`);
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    setOpen(false);
    toast.success("Appointment removed");
  };

  const step = (dir: 1 | -1) =>
    setAnchor((prev) => addDays(prev, view === "week" ? 7 * dir : dir));

  const rangeLabel =
    view === "week"
      ? `${format(days[0]!, "d MMM")} – ${format(days[6]!, "d MMM yyyy")}`
      : format(anchor, "EEEE, d MMMM yyyy");

  const dayCount = visible.filter((a) => a.date === dateKey(anchor)).length;
  const weekCount = visible.filter((a) => days.some((d) => dateKey(d) === a.date)).length;

  return (
    <div className="min-h-screen">
      <Toaster />

      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">360 Physio Clinic — ALREHAB</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current text-event-sports" /> 5.0 · Physical
                therapy clinic in New Cairo
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Ahmed Ben Hanbal, Second New Cairo
              </span>
              <a href="tel:01148008620" className="flex items-center gap-1 hover:text-foreground">
                <Phone className="h-3.5 w-3.5" /> 011 48008620
              </a>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Open · closes 10 PM
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
            <Button
              onClick={() => openSlot(`${dateKey(anchor)}|${activeTherapists[0]!.id}`, DAY_START)}
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
            All therapists
          </button>
          {THERAPISTS.map((t) => (
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
          <TimelineGrid rows={rowsForDay(anchor)} onSlotClick={openSlot} onEventClick={openEvent} />
        ) : (
          <div className="space-y-4">
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
                </h3>
                <TimelineGrid
                  rows={rowsForDay(d)}
                  onSlotClick={openSlot}
                  onEventClick={openEvent}
                />
              </section>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {SESSION_TYPES.map((t) => (
            <span key={t.id} className="flex items-center gap-1.5">
              <span className={cn("h-3 w-3 rounded-sm", typeClass(t.id))} />
              {t.label}
            </span>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {ATTENDANCE_STATUSES.map((s) => (
            <span key={s.id} className="flex items-center gap-1.5">
              <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px]", statusBadge(s.id))}>
                {s.short}
              </span>
            </span>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Click any empty slot to book a session, or click a session to reschedule it. Working hours
          9:00 AM – 10:00 PM. Sessions default to 60 minutes, and a therapist can take several
          patients in the same time range — parallel bookings stack inside the row. Mark each
          patient as showed up, cancelled or no show from the appointment dialog.
        </p>
      </main>

      <AppointmentDialog
        draft={draft}
        open={open}
        onOpenChange={setOpen}
        onSave={save}
        onDelete={remove}
      />
    </div>
  );
}
