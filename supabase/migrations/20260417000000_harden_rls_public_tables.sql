-- Harden RLS on public schema tables.
--
-- Fixes:
--   * public.leads_backup had RLS disabled → anyone with the anon key could
--     read/write/delete every row. Table is empty and unused; drop it.
--   * public.solar_comparisons had an anonymous SELECT policy with USING(true)
--     that exposed every lead (name, email, phone, proposals, consent) to
--     anyone with the anon key. Removed.
--   * public.leads had a no-op "Deny anon inserts" alongside a permissive
--     "Allow anonymous inserts" (PERMISSIVE policies OR together). Removed.
--   * Anonymous INSERT policies were WITH CHECK (true) on both lead tables,
--     allowing unlimited-size / junk payloads. Replaced with shape and
--     length guards that still permit the intended lead-capture flow from
--     the public SPA.

DROP TABLE IF EXISTS public.leads_backup;

DROP POLICY IF EXISTS "Allow anonymous select" ON public.solar_comparisons;
DROP POLICY IF EXISTS "Deny anon inserts" ON public.leads;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.solar_comparisons;
CREATE POLICY "anon_insert_solar_comparisons"
  ON public.solar_comparisons
  FOR INSERT
  TO anon
  WITH CHECK (
    source = 'solar_comparator'
    AND (name IS NULL OR char_length(name) <= 100)
    AND (email IS NULL OR char_length(email) <= 254)
    AND (phone IS NULL OR char_length(phone) <= 20)
    AND (consent_methods IS NULL OR char_length(consent_methods) <= 64)
    AND (consent_url IS NULL OR char_length(consent_url) <= 2048)
    AND (user_agent IS NULL OR char_length(user_agent) <= 1024)
    AND (ai_analysis IS NULL OR char_length(ai_analysis) <= 20000)
    AND (consent_text IS NULL OR char_length(consent_text) <= 8000)
    AND jsonb_typeof(proposals) = 'array'
    AND jsonb_array_length(proposals) <= 3
  );

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.leads;
CREATE POLICY "anon_insert_leads"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 254
    AND (phone IS NULL OR char_length(phone) <= 20)
    AND (state IS NULL OR char_length(state) <= 2)
    AND (city IS NULL OR char_length(city) <= 100)
    AND (zip_code IS NULL OR char_length(zip_code) <= 10)
    AND (consent_methods IS NULL OR char_length(consent_methods) <= 64)
    AND (consent_url IS NULL OR char_length(consent_url) <= 2048)
    AND (user_agent IS NULL OR char_length(user_agent) <= 1024)
    AND (consent_text IS NULL OR char_length(consent_text) <= 8000)
    AND (frustrations IS NULL OR char_length(frustrations) <= 4000)
  );
