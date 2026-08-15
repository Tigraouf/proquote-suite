-- Empêche un utilisateur authentifié de modifier lui-même son plan
-- d'abonnement (plan, plan_cycle, plan_renews_at) via un appel direct
-- au client Supabase. Ces colonnes ne doivent être écrites que par le
-- service_role (ex. une Edge Function déclenchée par un webhook Stripe).
--
-- La policy RLS "own profile" reste inchangée (elle couvre toujours
-- SELECT/INSERT/DELETE et l'UPDATE des colonnes autorisées ci-dessous) :
-- on ajoute ici une restriction au niveau colonne, qui s'applique en
-- plus de RLS et ne peut pas être contournée depuis le client.

REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  full_name,
  company_name,
  trade,
  legal_form,
  siret,
  vat_number,
  vat_rate,
  vat_exempt,
  address,
  postal_code,
  city,
  phone,
  email,
  website,
  iban,
  hourly_rate,
  payment_terms_days,
  logo_url,
  late_penalty_rate,
  recovery_fee,
  legal_notes
) ON public.profiles TO authenticated;

-- Garde-fou supplémentaire (defense in depth) : même si un futur GRANT
-- venait à réautoriser ces colonnes par erreur, le trigger bloque toute
-- tentative de changement de plan qui ne vient pas du service_role.
CREATE OR REPLACE FUNCTION public.prevent_client_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan
       OR NEW.plan_cycle IS DISTINCT FROM OLD.plan_cycle
       OR NEW.plan_renews_at IS DISTINCT FROM OLD.plan_renews_at THEN
      RAISE EXCEPTION 'Le changement de plan doit passer par le service d''abonnement.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_client_plan_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_block_client_plan_change ON public.profiles;
CREATE TRIGGER profiles_block_client_plan_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_client_plan_change();
