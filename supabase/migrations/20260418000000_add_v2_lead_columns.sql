-- Add v2 lead columns for the critical-analysis flow.
--
-- New columns:
--   * user_info  — JSON object with state, ZIP, utility info, priority weights.
--                  Used on the backend to hand off context to Powur for the
--                  formal proposal build.
--   * findings   — JSON array of {proposalName, findings: [...]} entries.
--                  Captures what the deterministic audit flagged at submit
--                  time so we can correlate with what the installer later
--                  quotes.
--
-- Both are nullable so legacy submissions (no v2 client) keep working.
-- The anon INSERT policy is re-created to include size + shape guards on the
-- new columns, otherwise the previous policy would silently allow them
-- through without any bound on size.

ALTER TABLE public.solar_comparisons
  ADD COLUMN IF NOT EXISTS user_info jsonb,
  ADD COLUMN IF NOT EXISTS findings jsonb;

DROP POLICY IF EXISTS "anon_insert_solar_comparisons" ON public.solar_comparisons;
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
    AND (user_info IS NULL OR (
      jsonb_typeof(user_info) = 'object'
      AND octet_length(user_info::text) <= 8192
    ))
    AND (findings IS NULL OR (
      jsonb_typeof(findings) = 'array'
      AND jsonb_array_length(findings) <= 3
      AND octet_length(findings::text) <= 16384
    ))
    AND (calculation_results IS NULL OR octet_length(calculation_results::text) <= 32768)
  );
