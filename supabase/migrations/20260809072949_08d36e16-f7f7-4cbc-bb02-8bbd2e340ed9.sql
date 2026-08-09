CREATE TYPE public.sub_event AS ENUM ('souscription','renouvellement','changement','expiration','annulation','reprise');

CREATE TABLE public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event public.sub_event NOT NULL DEFAULT 'souscription',
  plan public.plan_type NOT NULL DEFAULT 'premium',
  cycle public.plan_cycle NOT NULL DEFAULT 'none',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  period_end timestamp with time zone,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscription events" ON public.subscription_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX subscription_events_user_idx ON public.subscription_events (user_id, occurred_at DESC);

CREATE TRIGGER subscription_events_updated
  BEFORE UPDATE ON public.subscription_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();