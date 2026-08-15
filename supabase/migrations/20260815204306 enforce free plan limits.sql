-- Fait respecter côté base les limites du plan gratuit, en filet de
-- sécurité derrière la vérification déjà faite côté React (qui reste
-- utile pour l'UX : message immédiat, pas d'aller-retour serveur).
-- Sans ceci, un appel direct à l'API REST (hors app) pouvait dépasser
-- les 3 clients / 5 documents par mois du plan gratuit.

-- Statut premium effectif d'un utilisateur, en reprenant exactement la
-- même règle que le hook usePlan côté client : premium actif seulement
-- si le plan est 'premium' ET que l'abonnement n'est pas expiré.
CREATE OR REPLACE FUNCTION public.profile_is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan = 'premium'::public.plan_type
    AND (plan_renews_at IS NULL OR plan_renews_at >= now())
  FROM public.profiles
  WHERE id = _user_id;
$$;

REVOKE ALL ON FUNCTION public.profile_is_premium(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.profile_is_premium(uuid) TO authenticated, service_role;

-- Limite clients (plan gratuit : 3 clients max)
CREATE OR REPLACE FUNCTION public.enforce_free_client_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT COALESCE(public.profile_is_premium(NEW.user_id), false) THEN
    SELECT count(*) INTO v_count FROM public.clients WHERE user_id = NEW.user_id;
    IF v_count >= 3 THEN
      RAISE EXCEPTION 'Plan gratuit : 3 clients maximum. Passez en Premium pour un carnet illimité.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_free_client_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS clients_enforce_free_limit ON public.clients;
CREATE TRIGGER clients_enforce_free_limit
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_client_limit();

-- Limite documents (plan gratuit : 5 documents par mois civil,
-- comptés sur issue_date pour rester cohérent avec l'affichage client)
CREATE OR REPLACE FUNCTION public.enforce_free_document_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT COALESCE(public.profile_is_premium(NEW.user_id), false) THEN
    SELECT count(*) INTO v_count
    FROM public.documents
    WHERE user_id = NEW.user_id
      AND date_trunc('month', issue_date) = date_trunc('month', NEW.issue_date);
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'Plan gratuit : 5 documents par mois maximum. Passez en Premium pour un usage illimité.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_free_document_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS documents_enforce_free_limit ON public.documents;
CREATE TRIGGER documents_enforce_free_limit
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_document_limit();
