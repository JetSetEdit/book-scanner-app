-- Fix anonymous warning vote RPC (toggle-off + switch) and harden permissions
--
-- This migration addresses an ambiguity bug caused by RETURNS TABLE column names
-- colliding with column references in UPDATE statements, and makes the function
-- callable without auth using SECURITY DEFINER.

ALTER TABLE IF EXISTS public.anonymous_warning_votes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.anonymous_warning_votes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_anonymous_warning_vote(
  p_warning_id uuid,
  p_device_id text,
  p_is_helpful boolean
)
RETURNS TABLE (
  helpful_count integer,
  not_helpful_count integer,
  user_vote boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_vote boolean;
  has_existing boolean;
BEGIN
  IF p_warning_id IS NULL OR p_device_id IS NULL OR length(trim(p_device_id)) = 0 THEN
    RAISE EXCEPTION 'invalid arguments';
  END IF;

  -- Lock the warning row so count updates are atomic.
  PERFORM 1 FROM public.content_warnings cw WHERE cw.id = p_warning_id FOR UPDATE;

  SELECT v.is_helpful
    INTO existing_vote
  FROM public.anonymous_warning_votes v
  WHERE v.warning_id = p_warning_id
    AND v.device_id = p_device_id;

  has_existing := FOUND;

  IF has_existing THEN
    IF existing_vote = p_is_helpful THEN
      -- Toggle off
      DELETE FROM public.anonymous_warning_votes
      WHERE warning_id = p_warning_id
        AND device_id = p_device_id;

      UPDATE public.content_warnings cw
      SET helpful_count = GREATEST(cw.helpful_count - CASE WHEN existing_vote THEN 1 ELSE 0 END, 0),
          not_helpful_count = GREATEST(cw.not_helpful_count - CASE WHEN NOT existing_vote THEN 1 ELSE 0 END, 0),
          updated_at = now()
      WHERE cw.id = p_warning_id;

      user_vote := NULL;
    ELSE
      -- Switch vote
      UPDATE public.anonymous_warning_votes
      SET is_helpful = p_is_helpful,
          updated_at = now()
      WHERE warning_id = p_warning_id
        AND device_id = p_device_id;

      UPDATE public.content_warnings cw
      SET helpful_count = GREATEST(
            cw.helpful_count
            + CASE WHEN p_is_helpful THEN 1 ELSE 0 END
            - CASE WHEN existing_vote THEN 1 ELSE 0 END,
            0
          ),
          not_helpful_count = GREATEST(
            cw.not_helpful_count
            + CASE WHEN NOT p_is_helpful THEN 1 ELSE 0 END
            - CASE WHEN NOT existing_vote THEN 1 ELSE 0 END,
            0
          ),
          updated_at = now()
      WHERE cw.id = p_warning_id;

      user_vote := p_is_helpful;
    END IF;
  ELSE
    -- New vote
    INSERT INTO public.anonymous_warning_votes (warning_id, device_id, is_helpful)
    VALUES (p_warning_id, p_device_id, p_is_helpful);

    UPDATE public.content_warnings cw
    SET helpful_count = cw.helpful_count + CASE WHEN p_is_helpful THEN 1 ELSE 0 END,
        not_helpful_count = cw.not_helpful_count + CASE WHEN NOT p_is_helpful THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE cw.id = p_warning_id;

    user_vote := p_is_helpful;
  END IF;

  RETURN QUERY
  SELECT cw.helpful_count,
         cw.not_helpful_count,
         (SELECT v.is_helpful
          FROM public.anonymous_warning_votes v
          WHERE v.warning_id = p_warning_id
            AND v.device_id = p_device_id
          LIMIT 1) AS user_vote
  FROM public.content_warnings cw
  WHERE cw.id = p_warning_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_anonymous_warning_vote(uuid,text,boolean) TO anon, authenticated;


