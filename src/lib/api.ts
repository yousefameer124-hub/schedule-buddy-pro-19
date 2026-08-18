import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { AppRole } from "./schedule";

export type Patient = Tables<"patients">;
export type Therapist = Tables<"therapists">;
export type Appointment = Tables<"appointments">;
export type AppointmentType = Tables<"appointment_types">;
export type Package = Tables<"packages">;
export type PatientPackage = Tables<"patient_packages">;
export type Payment = Tables<"payments">;
export type Expense = Tables<"expenses">;
export type TreatmentNote = Tables<"treatment_notes">;
export type WaMessage = Tables<"whatsapp_messages">;
export type WaTemplate = Tables<"whatsapp_templates">;
export type ClinicSettings = Tables<"clinic_settings">;
export type AuditLog = Tables<"audit_logs">;

/** Current session + role. Role is created/read through bootstrap_current_user. */
export function useAuth() {
  const q = useQuery({
    queryKey: ["auth"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const meta = (user.user_metadata ?? {}) as { full_name?: string };
      const { data: role, error } = await supabase.rpc("bootstrap_current_user", {
        _full_name: meta.full_name ?? user.email ?? "Staff member",
      });
      if (error) throw error;
      return { user, role: role as AppRole };
    },
  });
  const role = q.data?.role ?? null;
  return {
    user: q.data?.user ?? null,
    role,
    loading: q.isLoading,
    isAdmin: role === "admin",
    isDesk: role === "admin" || role === "receptionist",
    isTherapist: role === "therapist",
  };
}

const run = async <T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) => {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
};

const rows = <T>(p: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) =>
  run(p).then((d) => (d ?? []) as T[]);

export const useTherapists = () =>
  useQuery({
    queryKey: ["therapists"],
    queryFn: () =>
      rows<Therapist>(supabase.from("therapists").select("*").order("sort_order")),
  });

export const usePatients = (search = "") =>
  useQuery({
    queryKey: ["patients", search],
    queryFn: () => {
      let q = supabase.from("patients").select("*").order("created_at", { ascending: false });
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(
          `full_name.ilike.${s},code.ilike.${s},phone.ilike.${s},whatsapp.ilike.${s},email.ilike.${s}`,
        );
      }
      return rows<Patient>(q.limit(200));
    },
  });

export const usePatient = (id: string) =>
  useQuery({
    queryKey: ["patient", id],
    queryFn: () => run<Patient>(supabase.from("patients").select("*").eq("id", id).maybeSingle()),
  });

export const useAppointmentTypes = () =>
  useQuery({
    queryKey: ["appointment_types"],
    queryFn: () => rows<AppointmentType>(supabase.from("appointment_types").select("*").order("name")),
  });

export const useAppointments = (from: string, to: string) =>
  useQuery({
    queryKey: ["appointments", from, to],
    queryFn: () =>
      rows<Appointment & { patients: { full_name: string } | null }>(
        supabase
          .from("appointments")
          .select("*, patients(full_name)")
          .gte("date", from)
          .lte("date", to)
          .order("start_minutes"),
      ),
  });

export const usePatientAppointments = (patientId: string) =>
  useQuery({
    queryKey: ["patient_appointments", patientId],
    queryFn: () =>
      rows<Appointment>(
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .order("date", { ascending: false }),
      ),
  });

export const usePackages = () =>
  useQuery({
    queryKey: ["packages"],
    queryFn: () => rows<Package>(supabase.from("packages").select("*").order("sessions")),
  });

/** Session counters for a patient — readable by all staff through a definer function. */
export const usePatientSessions = (patientId: string | null) =>
  useQuery({
    queryKey: ["patient_sessions", patientId],
    queryFn: () => rows(supabase.rpc("patient_sessions", { _patient_id: patientId })),
  });

/** Full patient package rows including money — admin only by RLS. */
export const usePatientPackages = (patientId?: string, enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["patient_packages", patientId ?? "all"],
    queryFn: () => {
      let q = supabase.from("patient_packages").select("*, patients(full_name)").order("created_at", {
        ascending: false,
      });
      if (patientId) q = q.eq("patient_id", patientId);
      return rows<PatientPackage & { patients: { full_name: string } | null }>(q);
    },
  });

export const usePayments = (enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["payments"],
    queryFn: () =>
      rows<Payment & { patients: { full_name: string } | null }>(
        supabase
          .from("payments")
          .select("*, patients(full_name)")
          .order("paid_at", { ascending: false }),
      ),
  });

export const useExpenses = (enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["expenses"],
    queryFn: () =>
      rows<Expense>(supabase.from("expenses").select("*").order("spent_on", { ascending: false })),
  });

export const useTreatmentNotes = (patientId: string) =>
  useQuery({
    queryKey: ["treatment_notes", patientId],
    queryFn: () =>
      rows<TreatmentNote>(
        supabase
          .from("treatment_notes")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ),
  });

export const useWaMessages = (patientId?: string, enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["wa_messages", patientId ?? "all"],
    queryFn: () => {
      let q = supabase
        .from("whatsapp_messages")
        .select("*, patients(full_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (patientId) q = q.eq("patient_id", patientId);
      return rows<WaMessage & { patients: { full_name: string } | null }>(q);
    },
  });

export const useWaTemplates = () =>
  useQuery({
    queryKey: ["wa_templates"],
    queryFn: () => rows<WaTemplate>(supabase.from("whatsapp_templates").select("*").order("key")),
  });

export const useClinicSettings = () =>
  useQuery({
    queryKey: ["clinic_settings"],
    queryFn: () =>
      run<ClinicSettings>(supabase.from("clinic_settings").select("*").eq("id", true).maybeSingle()),
  });

export const useAuditLogs = (enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["audit_logs"],
    queryFn: () =>
      rows<AuditLog>(
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
      ),
  });

export const logAudit = async (
  action: string,
  entity: string,
  entityId?: string | null,
  oldValue?: unknown,
  newValue?: unknown,
) => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({
    user_id: data.user.id,
    action,
    entity,
    entity_id: entityId ?? null,
    old_value: (oldValue ?? null) as never,
    new_value: (newValue ?? null) as never,
  });
};

type Op =
  | { op: "insert"; values: Record<string, unknown> }
  | { op: "update"; id: string | boolean; values: Record<string, unknown> }
  | { op: "delete"; id: string };

/** Generic write helper; RLS decides whether the write is allowed. */
export function useMutate(table: string, entity = table) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Op) => {
      const t = supabase.from(table as never) as never as {
        insert: (v: unknown) => { select: () => { single: () => Promise<any> } };
        update: (v: unknown) => { eq: (c: string, v: unknown) => Promise<any> };
        delete: () => { eq: (c: string, v: unknown) => Promise<any> };
      };
      let res: { data?: unknown; error?: { message: string } | null };
      if (args.op === "insert") res = await t.insert(args.values).select().single();
      else if (args.op === "update") res = await t.update(args.values).eq("id", args.id);
      else res = await t.delete().eq("id", args.id);
      if (res.error) throw new Error(res.error.message);
      const row = res.data as { id?: string } | undefined;
      await logAudit(
        args.op,
        entity,
        args.op === "delete" ? args.id : (row?.id ?? (args.op === "update" ? String(args.id) : null)),
        null,
        args.op === "delete" ? null : args.values,
      );
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}
