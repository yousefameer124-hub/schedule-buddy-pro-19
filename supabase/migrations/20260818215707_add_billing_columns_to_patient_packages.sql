ALTER TABLE public.patient_packages
  ADD COLUMN IF NOT EXISTS examination_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (examination_fee >= 0),
  ADD COLUMN IF NOT EXISTS session_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (session_price >= 0),
  ADD COLUMN IF NOT EXISTS discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  ADD COLUMN IF NOT EXISTS partner text NOT NULL DEFAULT 'none' CHECK (partner IN ('none','fibers','shefit')),
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS billing_notes text;

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS default_examination_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (default_examination_fee >= 0);
