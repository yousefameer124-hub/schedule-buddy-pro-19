import { cn } from "@/lib/utils";
import {
  DAY_END,
  DAY_START,
  SLOT,
  minutesToLabel,
  statusBadge,
  typeClass,
  type Appointment,
} from "@/lib/schedule";

/** assign each appointment a lane so simultaneous patients stack instead of overlap */
const layout = (list: Appointment[]) => {
  const sorted = [...list].sort((a, b) => a.start - b.start || a.duration - b.duration);
  const laneEnds: number[] = [];
  const placed = sorted.map((a) => {
    let lane = laneEnds.findIndex((end) => end <= a.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = a.start + a.duration;
    return { a, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
};

export const SLOT_WIDTH = 56;
export const ROW_HEIGHT = 56;
const LANE_HEIGHT = 26;

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
  const laid = rows.map((r) => layout(r.appointments));
  const heights = laid.map(({ lanes }) => Math.max(ROW_HEIGHT, lanes * LANE_HEIGHT + 12));

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="flex min-w-max">
        {/* left sticky labels */}
        <div className="sticky left-0 z-20 w-44 shrink-0 border-r bg-card">
          <div className="flex h-12 items-center border-b px-3 text-[11px] font-medium text-muted-foreground">
            Therapist
          </div>
          {rows.map((r, ri) => (
            <div
              key={r.id}
              style={{ height: heights[ri] }}
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

          {rows.map((r, ri) => (
            <div
              key={r.id}
              style={{ height: heights[ri] }}
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

              {laid[ri]!.placed.map(({ a, lane }) => {
                const left = ((a.start - DAY_START) / SLOT) * SLOT_WIDTH;
                const w = (a.duration / SLOT) * SLOT_WIDTH;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onEventClick(a)}
                    style={{
                      left: left + 2,
                      width: w - 4,
                      top: 6 + lane * LANE_HEIGHT,
                      height: LANE_HEIGHT - 4,
                    }}
                    className={cn(
                      "absolute flex items-center gap-1 overflow-hidden rounded-md px-2 text-left text-[11px] leading-tight shadow-sm ring-1 ring-black/5 transition-transform hover:scale-[1.01]",
                      typeClass(a.type),
                      a.status === "cancelled" && "line-through opacity-60",
                      a.status === "noshow" && "opacity-70",
                    )}
                    title={`${a.patient} · ${minutesToLabel(a.start)} · ${a.duration}m`}
                  >
                    {a.status && a.status !== "scheduled" && (
                      <span
                        className={cn(
                          "shrink-0 rounded-sm px-1 text-[9px] no-underline",
                          statusBadge(a.status),
                        )}
                      >
                        {a.status === "showed" ? "✓" : a.status === "cancelled" ? "✕" : "!"}
                      </span>
                    )}
                    <span className="truncate font-semibold">{a.patient}</span>
                    <span className="ml-auto shrink-0 opacity-90">{minutesToLabel(a.start)}</span>
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
