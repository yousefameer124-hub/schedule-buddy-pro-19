DROP VIEW IF EXISTS public.patient_session_summary;

CREATE OR REPLACE FUNCTION public.patient_sessions(_patient_id uuid)
RETURNS TABLE (
  id uuid,
  patient_id uuid,
  name text,
  total_sessions smallint,
  sessions_completed smallint,
  sessions_cancelled smallint,
  sessions_missed smallint,
  sessions_remaining smallint,
  start_date date,
  end_date date,
  active boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pp.id, pp.patient_id, pp.name, pp.total_sessions, pp.sessions_completed,
         pp.sessions_cancelled, pp.sessions_missed, pp.sessions_remaining,
         pp.start_date, pp.end_date, pp.active
  FROM public.patient_packages pp
  WHERE public.is_staff()
    AND (_patient_id IS NULL OR pp.patient_id = _patient_id)
  ORDER BY pp.created_at DESC
$$;

REVOKE ALL ON FUNCTION public.patient_sessions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.patient_sessions(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
REVOKE ALL ON FUNCTION public.is_desk() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_desk() TO authenticated;
REVOKE ALL ON FUNCTION public.my_therapist_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_therapist_id() TO authenticated;
REVOKE ALL ON FUNCTION public.bootstrap_current_user(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(text) TO authenticated;
REVOKE ALL ON FUNCTION public.set_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.recalc_patient_package(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.appointments_sync_package() FROM PUBLIC, anon, authenticated;