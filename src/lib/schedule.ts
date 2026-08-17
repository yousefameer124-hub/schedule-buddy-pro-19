import { addDays, format, startOfWeek } from "date-fns";
import type { Enums } from "@/integrations/supabase/types";

export type AppointmentStatus = Enums<"appointment_status">;
export type PaymentMethod = Enums<"payment_method">;
export type PaymentKind = Enums<"payment_kind">;
export type ExpenseCategory = Enums<"expense_category">;
export type WaStatus = Enums<"wa_status">;
export type AppRole = Enums<"app_role">;

export const APPOINTMENT_STATUSES: {
  id: AppointmentStatus;
  label: string;
  mark: string;
  badge: string;
}[] = [
  { id: "scheduled", label: "Scheduled", mark: "•", badge: "bg-foreground/10 text-foreground" },
  { id: "confirmed", label: "Confirmed", mark: "✓", badge: "bg-primary/15 text-primary" },
  { id: "checked_in", label: "Checked in", mark: "→", badge: "bg-event-evaluation text-event-evaluation-foreground" },
  { id: "in_progress", label: "In progress", mark: "…", badge: "bg-event-rehab text-event-rehab-foreground" },
  { id: "completed", label: "Completed", mark: "✓", badge: "bg-event-physio text-event-physio-foreground" },
  { id: "cancelled", label: "Cancelled", mark: "✕", badge: "bg-destructive text-destructive-foreground" },
  { id: "no_show", label: "No show", mark: "!", badge: "bg-event-sports text-event-sports-foreground" },
];

export const statusMeta = (s: AppointmentStatus) =>
  APPOINTMENT_STATUSES.find((x) => x.id === s) ?? APPOINTMENT_STATUSES[0]!;

export const statusBadge = (s: AppointmentStatus) => statusMeta(s).badge;

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "wallet", label: "Wallet" },
  { id: "other", label: "Other" },
];

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "salaries", label: "Salaries" },
  { id: "rent", label: "Rent" },
  { id: "utilities", label: "Utilities" },
  { id: "equipment", label: "Equipment" },
  { id: "maintenance", label: "Maintenance" },
  { id: "marketing", label: "Marketing" },
  { id: "supplies", label: "Supplies" },
  { id: "software", label: "Software" },
  { id: "other", label: "Other" },
];

export const EVENT_COLORS = ["evaluation", "physio", "sports", "rehab", "blocked"] as const;
export type EventColor = (typeof EVENT_COLORS)[number];

/** A calendar chip, mapped from a database appointment row. */
export type CalendarEvent = {
  id: string;
  title: string;
  patientId: string | null;
  therapistId: string;
  color: string;
  status: AppointmentStatus;
  typeName: string;
  /** yyyy-MM-dd */
  date: string;
  /** minutes from midnight */
  start: number;
  /** minutes */
  duration: number;
};

export const DEFAULT_DAY_START = 12 * 60;
export const DEFAULT_DAY_END = 24 * 60;
export const DEFAULT_DURATION = 60;

export const HOUR_OPTIONS = Array.from({ length: 25 }, (_, h) => h * 60);
export const START_OPTIONS = Array.from({ length: 48 }, (_, i) => i * 30);
export const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120];

export const initialsFrom = (name: string) =>
  name
    .replace(/^dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "DR";

/**
 * Columns are whole hours only; an off-hour column appears solely when an
 * appointment actually starts at that minute.
 */
export const buildTicks = (dayStart: number, dayEnd: number, extraStarts: number[] = []) => {
  const set = new Set<number>();
  for (let m = Math.floor(dayStart / 60) * 60; m < dayEnd; m += 60) set.add(m);
  for (const m of extraStarts) if (m >= dayStart && m < dayEnd) set.add(m);
  return [...set].sort((a, b) => a - b);
};

export const minutesToLabel = (m: number) => {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
};

export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

export const weekDays = (anchor: Date) => {
  const start = startOfWeek(anchor, { weekStartsOn: 6 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const typeClass = (color: string) => {
  const key = (EVENT_COLORS as readonly string[]).includes(color) ? color : "physio";
  return {
    evaluation: "bg-event-evaluation text-event-evaluation-foreground",
    physio: "bg-event-physio text-event-physio-foreground",
    sports: "bg-event-sports text-event-sports-foreground",
    rehab: "bg-event-rehab text-event-rehab-foreground",
    blocked: "bg-event-blocked text-event-blocked-foreground",
  }[key as EventColor];
};

export const overlaps = (
  a: { date: string; therapistId: string; start: number; duration: number },
  b: { date: string; therapistId: string; start: number; duration: number },
) =>
  a.date === b.date &&
  a.therapistId === b.therapistId &&
  a.start < b.start + b.duration &&
  b.start < a.start + a.duration;

export const money = (amount: number, currency = "EGP") =>
  `${currency} ${Number(amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const fillTemplate = (body: string, vars: Record<string, string | number>) =>
  body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) =>
    key in vars ? String(vars[key]) : `{{${key}}}`,
  );
