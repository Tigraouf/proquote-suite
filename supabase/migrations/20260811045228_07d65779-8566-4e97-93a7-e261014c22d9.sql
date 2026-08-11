ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS late_penalty_rate numeric NOT NULL DEFAULT 10.75,
  ADD COLUMN IF NOT EXISTS recovery_fee numeric NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS legal_notes text;

CREATE UNIQUE INDEX IF NOT EXISTS documents_user_type_number_key
  ON public.documents (user_id, type, number);

CREATE OR REPLACE FUNCTION public.next_document_number(_type public.doc_type)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_year text;
  v_seq int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_prefix := CASE WHEN _type = 'devis'::public.doc_type THEN 'DEV' ELSE 'FAC' END;
  v_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(split_part(number, '-', 3)::int), 0) + 1
    INTO v_seq
  FROM public.documents
  WHERE user_id = auth.uid()
    AND type = _type
    AND number ~ ('^' || v_prefix || '-' || v_year || '-[0-9]+$');
  RETURN v_prefix || '-' || v_year || '-' || lpad(v_seq::text, 3, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_document_number(public.doc_type) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_document_number(public.doc_type) TO authenticated;