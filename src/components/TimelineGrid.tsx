import { cn } from "@/lib/utils";
import {
  DAY_END,
  DAY_START,
  SLOT,
  minutesToLabel,
  typeClass,
  type Appointment,
} from "@/lib/schedule";

export const SLOT_WIDTH = 56;
export const ROW_HEIGHT = 56;

const slots = Array.from({ length: (DAY_END - DAY_START) / SLOT }, (_, i) => DAY_START + i * SLOT);

export type Row = {
  id: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
  appointments: Appointment[];
};

export function TimelineGrid({
  rows,
  onSlotClick,
  onEventClick,
}: {
  rows: Row[];
  onSlotClick: (rowId: string, minutes: number) => void;
  onEventClick: (appointment: Appointment) => void;
}) {
  const width = slots.length * SLOT_WIDTH;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="flex min-w-max">
        {/* left sticky labels */}
        <div className="sticky left-0 z-20 w-44 shrink-0 border-r bg-card">
          <div className="flex h-12 items-center border-b px-3 text-[11px] font-medium text-muted-foreground">
            Therapist
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              style={{ height: ROW_HEIGHT }}
              className={cn(
                "flex flex-col justify-center border-b px-3",
                r.highlight && "bg-today",
              )}
            >
              <span className="truncate text-sm font-semibold">{r.label}</span>
              {r.sublabel && (
                <span className="truncate text-[11px] text-muted-foreground">{r.sublabel}</span>
              )}
            </div>
          ))}
        </div>

        {/* time columns */}
        <div style={{ width }}>
          <div className="flex h-12 border-b">
            {slots.map((m) => (
              <div
                key={m}
                style={{ width: SLOT_WIDTH }}
                className={cn(
                  "flex shrink-0 items-center justify-center border-r text-[11px]",
                  m % 60 === 0
                    ? "border-grid-hour font-semibold"
                    : "border-grid-line text-muted-foreground",
                )}
              >
                {minutesToLabel(m).replace(":00", "")}
              </div>
            ))}
          </div>

          {rows.map((r) => (
            <div
              key={r.id}
              style={{ height: ROW_HEIGHT }}
              className={cn("relative border-b", r.highlight && "bg-today")}
            >
              <div className="flex h-full">
                {slots.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onSlotClick(r.id, m)}
                    style={{ width: SLOT_WIDTH }}
                    className={cn(
                      "h-full shrink-0 border-r transition-colors hover:bg-accent/60",
                      m % 60 === 0 ? "border-grid-hour" : "border-grid-line",
                    )}
                    aria-label={`Book ${minutesToLabel(m)}`}
                  />
                ))}
              </div>

              {r.appointments.map((a) => {
                const left = ((a.start - DAY_START) / SLOT) * SLOT_WIDTH;
                const w = (a.duration / SLOT) * SLOT_WIDTH;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onEventClick(a)}
                    style={{ left: left + 2, width: w - 4, top: 4, height: ROW_HEIGHT - 12 }}
                    className={cn(
                      "absolute overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight shadow-sm ring-1 ring-black/5 transition-transform hover:scale-[1.01]",
                      typeClass(a.type),
                    )}
                  >
                    <span className="block truncate font-semibold">{a.patient}</span>
                    <span className="block truncate opacity-90">
                      {minutesToLabel(a.start)} · {a.duration}m
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
