import { addDays, format, startOfWeek } from "date-fns";

export type SessionType = "evaluation" | "physio" | "sports" | "rehab" | "blocked";

export type Therapist = {
  id: string;
  name: string;
  initials: string;
};

export type Appointment = {
  id: string;
  patient: string;
  phone?: string;
  note?: string;
  therapistId: string;
  type: SessionType;
  /** yyyy-MM-dd */
  date: string;
  /** minutes from midnight */
  start: number;
  /** minutes */
  duration: number;
};

export const THERAPISTS: Therapist[] = [
  { id: "t1", name: "Dr. Mohamed Adel", initials: "MA" },
  { id: "t2", name: "Dr. Nour Hassan", initials: "NH" },
  { id: "t3", name: "Dr. Karim Fouad", initials: "KF" },
];

export const SESSION_TYPES: { id: SessionType; label: string }[] = [
  { id: "evaluation", label: "Initial evaluation" },
  { id: "physio", label: "Physiotherapy session" },
  { id: "sports", label: "Sports injury" },
  { id: "rehab", label: "Rehabilitation program" },
  { id: "blocked", label: "Blocked / unavailable" },
];

export const DAY_START = 9 * 60;
export const DAY_END = 22 * 60;
export const SLOT = 30;
export const SLOT_HEIGHT = 28;

export const minutesToLabel = (m: number) => {
  const h = Math.floor(m / 60);
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

export const typeClass = (type: SessionType) =>
  ({
    evaluation: "bg-event-evaluation text-event-evaluation-foreground",
    physio: "bg-event-physio text-event-physio-foreground",
    sports: "bg-event-sports text-event-sports-foreground",
    rehab: "bg-event-rehab text-event-rehab-foreground",
    blocked: "bg-event-blocked text-event-blocked-foreground",
  })[type];

export const overlaps = (a: Appointment, b: Appointment) =>
  a.date === b.date &&
  a.therapistId === b.therapistId &&
  a.start < b.start + b.duration &&
  b.start < a.start + a.duration;

export const seedAppointments = (anchor: Date): Appointment[] => {
  const d = weekDays(anchor);
  const mk = (
    i: number,
    start: number,
    duration: number,
    patient: string,
    therapistId: string,
    type: SessionType,
  ): Appointment => ({
    id: `${i}-${start}-${therapistId}`,
    patient,
    therapistId,
    type,
    date: dateKey(d[i]!),
    start,
    duration,
  });

  return [
    mk(0, 9 * 60, 60, "Ahmed Selim", "t1", "evaluation"),
    mk(0, 11 * 60, 45, "Mariam Adly", "t2", "physio"),
    mk(1, 10 * 60 + 30, 60, "Youssef Tarek", "t1", "sports"),
    mk(1, 13 * 60, 90, "Hana Ibrahim", "t3", "rehab"),
    mk(2, 12 * 60, 45, "Omar Zaki", "t2", "physio"),
    mk(2, 17 * 60, 60, "Salma Ashraf", "t1", "sports"),
    mk(3, 15 * 60, 120, "Team training block", "t3", "blocked"),
    mk(4, 9 * 60 + 30, 45, "Nada Wael", "t2", "evaluation"),
    mk(4, 18 * 60, 60, "Khaled Rami", "t1", "rehab"),
    mk(5, 16 * 60, 45, "Laila Sami", "t3", "physio"),
    mk(6, 11 * 60, 60, "Tamer Nabil", "t1", "sports"),
  ];
};
