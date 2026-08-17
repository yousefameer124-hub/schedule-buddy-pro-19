-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','receptionist','therapist');
CREATE TYPE public.appointment_status AS ENUM ('scheduled','confirmed','checked_in','in_progress','completed','cancelled','no_show');
CREATE TYPE public.payment_method AS ENUM ('cash','visa','mastercard','bank_transfer','wallet','other');
CREATE TYPE public.payment_kind AS ENUM ('payment','refund','discount');
CREATE TYPE public.expense_category AS ENUM ('salaries','rent','utilities','equipment','maintenance','marketing','supplies','software','other');
CREATE TYPE public.wa_status AS ENUM ('pending','sent','delivered','read','failed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  avatar_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
$$;

-- admin or receptionist (front-desk level access, no money)
CREATE OR REPLACE FUNCTION public.is_desk()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','receptionist')
  )
$$;

CREATE POLICY "profiles readable by staff" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff());
CREATE POLICY "own profile insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "admin deletes profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "roles readable" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- first signup becomes admin; later signups get receptionist
CREATE OR REPLACE FUNCTION public.bootstrap_current_user(_full_name text)
RETURNS public.app_role LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role public.app_role;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (auth.uid(), COALESCE(NULLIF(_full_name,''),'Staff member'), auth.email())
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(NULLIF(EXCLUDED.full_name,''), public.profiles.full_name),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        updated_at = now();

  SELECT role INTO _role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  IF _role IS NOT NULL THEN RETURN _role; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    _role := 'admin';
  ELSE
    _role := 'receptionist';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), _role)
    ON CONFLICT DO NOTHING;
  RETURN _role;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(text) TO authenticated;

-- admin-managed role assignment
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin only'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;

-- ============ shared updated_at ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ THERAPISTS ============
CREATE TABLE public.therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  initials text NOT NULL DEFAULT '',
  phone text,
  email text,
  specialty text,
  photo_url text,
  working_days smallint[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  work_start smallint NOT NULL DEFAULT 720,
  work_end smallint NOT NULL DEFAULT 1440,
  break_start smallint,
  break_end smallint,
  active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.therapists TO authenticated;
GRANT ALL ON public.therapists TO service_role;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER therapists_touch BEFORE UPDATE ON public.therapists
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "staff read therapists" ON public.therapists
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "desk writes therapists" ON public.therapists
  FOR INSERT TO authenticated WITH CHECK (public.is_desk());
CREATE POLICY "desk updates therapists" ON public.therapists
  FOR UPDATE TO authenticated USING (public.is_desk() OR profile_id = auth.uid());
CREATE POLICY "admin deletes therapists" ON public.therapists
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.my_therapist_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.therapists WHERE profile_id = auth.uid() LIMIT 1
$$;

-- ============ APPOINTMENT TYPES ============
CREATE TABLE public.appointment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration_minutes smallint NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  default_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (default_price >= 0),
  color text NOT NULL DEFAULT 'physio',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_types TO authenticated;
GRANT ALL ON public.appointment_types TO service_role;
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read types" ON public.appointment_types
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "admin writes types" ON public.appointment_types
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ PATIENTS ============
CREATE SEQUENCE public.patient_code_seq START 1001;
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('P-' || nextval('public.patient_code_seq')),
  full_name text NOT NULL,
  date_of_birth date,
  gender text,
  phone text,
  whatsapp text,
  email text,
  address text,
  emergency_contact text,
  medical_condition text,
  diagnosis text,
  treatment_plan text,
  notes text,
  alerts text,
  primary_therapist_id uuid REFERENCES public.therapists(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE INDEX patients_name_idx ON public.patients (lower(full_name));
CREATE INDEX patients_phone_idx ON public.patients (phone);
CREATE TRIGGER patients_touch BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PACKAGES ============
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sessions smallint NOT NULL CHECK (sessions > 0),
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  final_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (final_price >= 0),
  validity_days smallint NOT NULL DEFAULT 90 CHECK (validity_days > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manages packages" ON public.packages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.patient_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  name text NOT NULL DEFAULT 'Session package',
  total_sessions smallint NOT NULL CHECK (total_sessions > 0),
  sessions_completed smallint NOT NULL DEFAULT 0 CHECK (sessions_completed >= 0),
  sessions_cancelled smallint NOT NULL DEFAULT 0 CHECK (sessions_cancelled >= 0),
  sessions_missed smallint NOT NULL DEFAULT 0 CHECK (sessions_missed >= 0),
  sessions_remaining smallint GENERATED ALWAYS AS (total_sessions - sessions_completed) STORED,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  amount_paid numeric(12,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_packages TO authenticated;
GRANT ALL ON public.patient_packages TO service_role;
ALTER TABLE public.patient_packages ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER patient_packages_touch BEFORE UPDATE ON public.patient_packages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
-- money lives here, so only admins may read rows directly
CREATE POLICY "admin manages patient packages" ON public.patient_packages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- non-financial session view for receptionists / therapists
CREATE VIEW public.patient_session_summary
WITH (security_invoker = off) AS
  SELECT pp.id, pp.patient_id, pp.name, pp.total_sessions, pp.sessions_completed,
         pp.sessions_cancelled, pp.sessions_missed, pp.sessions_remaining,
         pp.start_date, pp.end_date, pp.active
  FROM public.patient_packages pp
  WHERE public.is_staff();
GRANT SELECT ON public.patient_session_summary TO authenticated;

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES public.therapists(id) ON DELETE CASCADE,
  appointment_type_id uuid REFERENCES public.appointment_types(id) ON DELETE SET NULL,
  patient_package_id uuid REFERENCES public.patient_packages(id) ON DELETE SET NULL,
  title text,
  date date NOT NULL,
  start_minutes smallint NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 1440),
  duration_minutes smallint NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE INDEX appointments_date_idx ON public.appointments (date);
CREATE INDEX appointments_therapist_idx ON public.appointments (therapist_id, date);
CREATE INDEX appointments_patient_idx ON public.appointments (patient_id);
CREATE TRIGGER appointments_touch BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "appointments readable by desk or own therapist" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.is_desk() OR therapist_id = public.my_therapist_id());
CREATE POLICY "desk creates appointments" ON public.appointments
  FOR INSERT TO authenticated WITH CHECK (public.is_desk());
CREATE POLICY "desk or own therapist updates appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.is_desk() OR therapist_id = public.my_therapist_id());
CREATE POLICY "admin deletes appointments" ON public.appointments
  FOR DELETE TO authenticated USING (public.is_admin());

-- patients: desk sees all, therapist only their own patients
CREATE POLICY "patients readable" ON public.patients
  FOR SELECT TO authenticated
  USING (
    public.is_desk()
    OR primary_therapist_id = public.my_therapist_id()
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.patient_id = patients.id AND a.therapist_id = public.my_therapist_id()
    )
  );
CREATE POLICY "desk creates patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (public.is_desk());
CREATE POLICY "desk updates patients" ON public.patients
  FOR UPDATE TO authenticated USING (public.is_desk());
CREATE POLICY "admin deletes patients" ON public.patients
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============ SESSION COUNT CONSISTENCY ============
CREATE OR REPLACE FUNCTION public.recalc_patient_package(_pkg_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _pkg_id IS NULL THEN RETURN; END IF;
  UPDATE public.patient_packages pp
  SET sessions_completed = c.completed,
      sessions_cancelled = c.cancelled,
      sessions_missed = c.missed
  FROM (
    SELECT
      LEAST(COUNT(*) FILTER (WHERE status = 'completed'), (SELECT total_sessions FROM public.patient_packages WHERE id = _pkg_id)) AS completed,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
      COUNT(*) FILTER (WHERE status = 'no_show') AS missed
    FROM public.appointments WHERE patient_package_id = _pkg_id
  ) c
  WHERE pp.id = _pkg_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.appointments_sync_package()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_patient_package(OLD.patient_package_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_patient_package(NEW.patient_package_id);
  IF TG_OP = 'UPDATE' AND OLD.patient_package_id IS DISTINCT FROM NEW.patient_package_id THEN
    PERFORM public.recalc_patient_package(OLD.patient_package_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER appointments_package_sync
AFTER INSERT OR UPDATE OF status, patient_package_id OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.appointments_sync_package();

-- ============ TREATMENT NOTES ============
CREATE TABLE public.treatment_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_notes TO authenticated;
GRANT ALL ON public.treatment_notes TO service_role;
ALTER TABLE public.treatment_notes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER treatment_notes_touch BEFORE UPDATE ON public.treatment_notes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "notes readable" ON public.treatment_notes
  FOR SELECT TO authenticated
  USING (public.is_desk() OR therapist_id = public.my_therapist_id() OR author_id = auth.uid());
CREATE POLICY "staff write notes" ON public.treatment_notes
  FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND author_id = auth.uid());
CREATE POLICY "author or admin updates notes" ON public.treatment_notes
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin deletes notes" ON public.treatment_notes
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============ PAYMENTS (ADMIN ONLY) ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_package_id uuid REFERENCES public.patient_packages(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE SET NULL,
  kind public.payment_kind NOT NULL DEFAULT 'payment',
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method public.payment_method NOT NULL DEFAULT 'cash',
  paid_at date NOT NULL DEFAULT current_date,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX payments_paid_at_idx ON public.payments (paid_at);
CREATE TRIGGER payments_touch BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "admin only payments" ON public.payments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.expense_category NOT NULL DEFAULT 'other',
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  spent_on date NOT NULL DEFAULT current_date,
  method public.payment_method NOT NULL DEFAULT 'cash',
  description text,
  receipt_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE INDEX expenses_date_idx ON public.expenses (spent_on);
CREATE TRIGGER expenses_touch BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "admin only expenses" ON public.expenses
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ WHATSAPP ============
CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  body text NOT NULL,
  meta_template_name text,
  language_code text NOT NULL DEFAULT 'en',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER wa_templates_touch BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "staff read wa templates" ON public.whatsapp_templates
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "admin manages wa templates" ON public.whatsapp_templates
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  template_key text,
  message_type text NOT NULL DEFAULT 'manual',
  to_number text NOT NULL,
  body text NOT NULL,
  status public.wa_status NOT NULL DEFAULT 'pending',
  provider_message_id text,
  error text,
  sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX wa_messages_patient_idx ON public.whatsapp_messages (patient_id, created_at DESC);
CREATE TRIGGER wa_messages_touch BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "desk reads wa messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated USING (public.is_desk());
CREATE POLICY "desk creates wa messages" ON public.whatsapp_messages
  FOR INSERT TO authenticated WITH CHECK (public.is_desk());
CREATE POLICY "admin updates wa messages" ON public.whatsapp_messages
  FOR UPDATE TO authenticated USING (public.is_admin());

-- ============ SETTINGS / HOLIDAYS ============
CREATE TABLE public.clinic_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  clinic_name text NOT NULL DEFAULT '360 Physio Clinic — ALREHAB',
  logo_url text,
  address text DEFAULT 'Ahmed Ben Hanbal, Second New Cairo',
  phone text DEFAULT '011 48008620',
  whatsapp text DEFAULT '01148008620',
  email text,
  day_start smallint NOT NULL DEFAULT 720,
  day_end smallint NOT NULL DEFAULT 1440,
  default_duration smallint NOT NULL DEFAULT 60,
  cancellation_hours smallint NOT NULL DEFAULT 24,
  charge_no_show boolean NOT NULL DEFAULT false,
  charge_late_cancel boolean NOT NULL DEFAULT false,
  low_sessions_threshold smallint NOT NULL DEFAULT 2,
  reminder_hours smallint[] NOT NULL DEFAULT '{24,2}',
  default_package_validity smallint NOT NULL DEFAULT 90,
  currency text NOT NULL DEFAULT 'EGP',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clinic_settings TO authenticated;
GRANT ALL ON public.clinic_settings TO service_role;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER clinic_settings_touch BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "staff read settings" ON public.clinic_settings
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "admin writes settings" ON public.clinic_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'Clinic closed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read holidays" ON public.holidays
  FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "admin writes holidays" ON public.holidays
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE POLICY "admin reads audit" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "staff writes audit" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND user_id = auth.uid());

-- ============ SEED ============
INSERT INTO public.clinic_settings (id) VALUES (true);

INSERT INTO public.appointment_types (name, duration_minutes, default_price, color) VALUES
  ('Initial Assessment', 60, 700, 'evaluation'),
  ('Follow-up', 45, 400, 'physio'),
  ('Physiotherapy Session', 60, 500, 'physio'),
  ('Sports Injury', 60, 600, 'sports'),
  ('Rehabilitation Program', 90, 800, 'rehab'),
  ('Consultation', 30, 300, 'evaluation');

INSERT INTO public.therapists (name, initials, specialty, sort_order) VALUES
  ('Dr. Tarek Helmy', 'TH', 'Physiotherapy', 1),
  ('Dr. Mahmoud Naser', 'MN', 'Sports injury', 2),
  ('Dr. Mohammed Kandil', 'MK', 'Rehabilitation', 3),
  ('Dr. Mariam', 'MA', 'Physiotherapy', 4),
  ('Dr. Sara', 'SA', 'Physiotherapy', 5),
  ('Dr. Mohsen', 'MO', 'Manual therapy', 6);

INSERT INTO public.packages (name, sessions, price, discount, final_price, validity_days) VALUES
  ('5 Sessions Package', 5, 2500, 0, 2500, 60),
  ('10 Sessions Package', 10, 5000, 500, 4500, 90),
  ('20 Sessions Package', 20, 10000, 1500, 8500, 180);

INSERT INTO public.whatsapp_templates (key, name, body) VALUES
  ('appointment_confirmation', 'Appointment confirmation',
   'Hello {{patient_name}},

Your appointment at {{clinic_name}} is confirmed.
Date: {{date}}
Time: {{time}}
Therapist: {{therapist_name}}

If you need to reschedule, please contact us.
Thank you.'),
  ('appointment_reminder', 'Appointment reminder',
   'Hello {{patient_name}},

This is a reminder of your appointment at {{clinic_name}} on {{date}} at {{time}} with {{therapist_name}}.'),
  ('appointment_cancellation', 'Appointment cancellation',
   'Hello {{patient_name}},

Your appointment at {{clinic_name}} on {{date}} at {{time}} has been cancelled. Please contact us to rebook.'),
  ('appointment_reschedule', 'Appointment rescheduled',
   'Hello {{patient_name}},

Your appointment at {{clinic_name}} has been rescheduled to {{date}} at {{time}} with {{therapist_name}}.'),
  ('package_reminder', 'Session package reminder',
   'Hello {{patient_name}},

You have {{remaining_sessions}} sessions remaining in your current package at {{clinic_name}}.'),
  ('payment_reminder', 'Payment reminder',
   'Hello {{patient_name}},

Our records show an outstanding balance of {{amount_due}} at {{clinic_name}}. Please contact us to settle it. Thank you.');