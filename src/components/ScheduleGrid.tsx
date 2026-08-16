import { cn } from "@/lib/utils";
import {
  DAY_END,
  DAY_START,
  SLOT,
  SLOT_HEIGHT,
  THERAPISTS,
  minutesToLabel,
  typeClass,
  type Appointment,
} from "@/lib/schedule";

export type Column = {
  id: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
  appointments: Appointment[];
};

const slots = Array.from({ length: (DAY_END - DAY_START) / SLOT }, (_, i) => DAY_START + i * SLOT);

export function ScheduleGrid({
  columns,
  onSlotClick,
  onEventClick,
}: {
  columns: Column[];
  onSlotClick: (columnId: string, minutes: number) => void;
  onEventClick: (appointment: Appointment) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[820px]">
        {/* header */}
        <div className="sticky top-0 z-20 flex border-b bg-card/95 backdrop-blur">
          <div className="w-16 shrink-0 border-r py-2 text-center text-[11px] font-medium text-muted-foreground">
            Time
          </div>
          {columns.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex-1 border-r px-2 py-2 text-center last:border-r-0",
                c.highlight && "bg-today",
              )}
            >
              <div className="text-sm font-semibold">{c.label}</div>
              {c.sublabel && (
                <div className="text-[11px] text-muted-foreground">{c.sublabel}</div>
              )}
            </div>
          ))}
        </div>

        {/* body */}
        <div className="flex">
          <div className="w-16 shrink-0 border-r">
            {slots.map((m) => (
              <div
                key={m}
                style={{ height: SLOT_HEIGHT }}
                className="relative border-b border-grid-line text-[10px] text-muted-foreground"
              >
                {m % 60 === 0 && (
                  <span className="absolute right-1 -top-1.5 bg-card px-1">
                    {minutesToLabel(m)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {columns.map((c) => (
            <div
              key={c.id}
              className={cn("relative flex-1 border-r last:border-r-0", c.highlight && "bg-today")}
            >
              {slots.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSlotClick(c.id, m)}
                  style={{ height: SLOT_HEIGHT }}
                  className={cn(
                    "block w-full border-b transition-colors hover:bg-accent/60",
                    m % 60 === 0 ? "border-grid-hour" : "border-grid-line",
                  )}
                  aria-label={`Book ${minutesToLabel(m)}`}
                />
              ))}

              {c.appointments.map((a) => {
                const top = ((a.start - DAY_START) / SLOT) * SLOT_HEIGHT;
                const height = (a.duration / SLOT) * SLOT_HEIGHT;
                const therapist = THERAPISTS.find((t) => t.id === a.therapistId);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onEventClick(a)}
                    style={{ top: top + 1, height: height - 3 }}
                    className={cn(
                      "absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight shadow-sm ring-1 ring-black/5 transition-transform hover:scale-[1.01]",
                      typeClass(a.type),
                    )}
                  >
                    <span className="block truncate font-semibold">{a.patient}</span>
                    <span className="block truncate opacity-90">
                      {minutesToLabel(a.start)} · {therapist?.initials}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
