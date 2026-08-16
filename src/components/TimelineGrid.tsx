import { cn } from "@/lib/utils";
import { minutesToLabel, statusBadge, typeClass, type Appointment } from "@/lib/schedule";

export const SLOT_WIDTH = 96;
export const ROW_HEIGHT = 60;
const LANE_HEIGHT = 46;
const HEADER_HEIGHT = 44;

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
  now,
  onSlotClick,
  onEventClick,
}: {
  rows: Row[];
  /** column start minutes: whole hours plus any off-hour appointment start */
  ticks: number[];
  dayEnd: number;
  /** minutes from midnight for the "now" marker, when this grid shows today */
  now?: number;
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
    return { left, width: Math.max(SLOT_WIDTH, w) };
  };

  const nowLeft =
    now !== undefined && ticks.length && now >= ticks[0]! && now < dayEnd
      ? place(now, 0).left
      : null;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <div className="flex min-w-max">
        {/* left sticky labels */}
        <div className="sticky left-0 z-20 w-48 shrink-0 border-r bg-card">
          <div
            style={{ height: HEADER_HEIGHT }}
            className="flex items-center border-b bg-muted/50 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Doctor
          </div>
          {rows.map((r, ri) => (
            <div
              key={r.id}
              style={{ height: heights[ri] }}
              className={cn(
                "flex flex-col justify-center gap-0.5 border-b px-3 last:border-b-0",
                r.highlight && "bg-today",
              )}
            >
              <span className="text-sm font-semibold leading-tight">{r.label}</span>
              <span className="text-[11px] text-muted-foreground">
                {r.appointments.length === 0
                  ? "No sessions"
                  : `${r.appointments.length} session${r.appointments.length > 1 ? "s" : ""}`}
              </span>
            </div>
          ))}
        </div>

        {/* time columns */}
        <div className="relative" style={{ width }}>
          <div style={{ height: HEADER_HEIGHT }} className="flex border-b bg-muted/50">
            {ticks.map((m) => (
              <div
                key={m}
                style={{ width: SLOT_WIDTH }}
                className={cn(
                  "flex shrink-0 items-center justify-center border-r text-[11px] last:border-r-0",
                  m % 60 === 0
                    ? "border-grid-hour font-semibold"
                    : "border-grid-line font-medium text-muted-foreground",
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
              className={cn("relative border-b last:border-b-0", r.highlight && "bg-today")}
            >
              <div className="flex h-full">
                {ticks.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onSlotClick(r.id, m)}
                    style={{ width: SLOT_WIDTH }}
                    className={cn(
                      "h-full shrink-0 border-r transition-colors last:border-r-0 hover:bg-accent/60",
                      m % 60 === 0 ? "border-grid-hour" : "border-grid-line",
                    )}
                    aria-label={`Book ${r.label} at ${minutesToLabel(m)}`}
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
                      width: pos.width - 4,
                      top: 6 + lane * LANE_HEIGHT,
                      height: LANE_HEIGHT - 4,
                    }}
                    className={cn(
                      "absolute flex items-center gap-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      typeClass(a.type),
                      a.status === "cancelled" && "line-through opacity-60",
                      a.status === "noshow" && "opacity-70",
                    )}
                    title={`${a.patient} · ${minutesToLabel(a.start)} – ${minutesToLabel(a.start + a.duration)}`}
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
                    <span className="whitespace-normal break-words font-semibold leading-snug">
                      {a.patient}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {nowLeft !== null && (
            <div
              className="pointer-events-none absolute bottom-0 z-10 w-px bg-primary"
              style={{ left: nowLeft, top: HEADER_HEIGHT }}
            >
              <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
