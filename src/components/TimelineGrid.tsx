import { cn } from "@/lib/utils";
import { minutesToLabel, statusBadge, typeClass, type Appointment } from "@/lib/schedule";

export const SLOT_WIDTH = 84;
export const ROW_HEIGHT = 56;
const LANE_HEIGHT = 26;

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

export type Row = {
  id: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
  appointments: Appointment[];
};

export function TimelineGrid({
  rows,
  ticks,
  dayEnd,
  onSlotClick,
  onEventClick,
}: {
  rows: Row[];
  /** column start minutes: whole hours plus any off-hour appointment start */
  ticks: number[];
  dayEnd: number;
  onSlotClick: (rowId: string, minutes: number) => void;
  onEventClick: (appointment: Appointment) => void;
}) {
  const ends = ticks.map((t, i) => ticks[i + 1] ?? dayEnd);
  const width = ticks.length * SLOT_WIDTH;

  const laid = rows.map((r) => layout(r.appointments));
  const heights = laid.map(({ lanes }) => Math.max(ROW_HEIGHT, lanes * LANE_HEIGHT + 12));

  /** pixel offset / width for an appointment across variable-length columns */
  const place = (start: number, duration: number) => {
    const end = start + duration;
    let left = 0;
    let w = 0;
    ticks.forEach((t, i) => {
      const colEnd = ends[i]!;
      const span = Math.max(1, colEnd - t);
      if (colEnd <= start) {
        left += SLOT_WIDTH;
        return;
      }
      if (t >= end) return;
      if (t < start) left += ((start - t) / span) * SLOT_WIDTH;
      const covered = Math.min(colEnd, end) - Math.max(t, start);
      w += (covered / span) * SLOT_WIDTH;
    });
    return { left, width: Math.max(24, w) };
  };

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
            {ticks.map((m) => (
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
                {ticks.map((m) => (
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
                const pos = place(a.start, a.duration);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onEventClick(a)}
                    style={{
                      left: pos.left + 2,
                      width: Math.max(24, pos.width - 4),
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
