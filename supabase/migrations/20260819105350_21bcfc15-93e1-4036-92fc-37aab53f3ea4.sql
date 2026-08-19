ALTER TABLE public.patient_packages
  ADD COLUMN IF NOT EXISTS examination_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS session_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_date date,
  ADD COLUMN IF NOT EXISTS partner text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS billing_notes text;

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS default_examination_fee numeric NOT NULL DEFAULT 0;