CREATE OR REPLACE FUNCTION public.record_admin_login_failure(
  p_email_hash text,
  p_ip_hash text
) RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item record;
  next_count integer;
  lock_step integer;
  lock_minutes integer;
  next_lock timestamptz;
  latest_lock timestamptz;
BEGIN
  FOR item IN
    SELECT scope, key_hash
    FROM (VALUES ('account'::text, p_email_hash), ('ip'::text, p_ip_hash)) AS keys(scope, key_hash)
    ORDER BY key_hash, scope
  LOOP
    INSERT INTO public.admin_login_throttles AS throttle
      (scope, key_hash, failure_count, window_started_at, last_failure_at, locked_until)
    VALUES (item.scope, item.key_hash, 1, now(), now(), NULL)
    ON CONFLICT (scope, key_hash) DO UPDATE SET
      failure_count = CASE
        WHEN throttle.last_failure_at < now() - interval '24 hours' THEN 1
        ELSE throttle.failure_count + 1
      END,
      window_started_at = CASE
        WHEN throttle.last_failure_at < now() - interval '24 hours' THEN now()
        ELSE throttle.window_started_at
      END,
      last_failure_at = now(),
      locked_until = NULL
    RETURNING failure_count INTO next_count;

    lock_step := floor((next_count - 5)::numeric / 5)::integer;
    lock_minutes := CASE
      WHEN next_count < 5 THEN 0
      WHEN lock_step = 0 THEN 1
      WHEN lock_step = 1 THEN 5
      WHEN lock_step = 2 THEN 15
      ELSE least(1440, (30 * power(2, lock_step - 3))::integer)
    END;
    next_lock := CASE WHEN lock_minutes > 0 THEN now() + make_interval(mins => lock_minutes) ELSE NULL END;

    UPDATE public.admin_login_throttles
    SET locked_until = next_lock
    WHERE scope = item.scope AND key_hash = item.key_hash;

    latest_lock := greatest(latest_lock, next_lock);
  END LOOP;

  RETURN latest_lock;
END;
$$;

CREATE TABLE IF NOT EXISTS public.progressive_request_throttles (
  scope text NOT NULL CHECK (scope IN ('password_reset_ip', 'password_reset_account', 'contact_ip')),
  key_hash text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  lock_level integer NOT NULL DEFAULT 0 CHECK (lock_level >= 0),
  locked_until timestamptz,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key_hash)
);

ALTER TABLE public.progressive_request_throttles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.progressive_request_throttles FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_progressive_request_throttle(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  throttle public.progressive_request_throttles%rowtype;
  next_count integer;
  next_level integer;
  lock_minutes integer;
BEGIN
  IF p_scope NOT IN ('password_reset_ip', 'password_reset_account', 'contact_ip')
    OR p_key_hash !~ '^[a-f0-9]{64}$'
    OR p_limit < 1 OR p_limit > 1000
    OR p_window_seconds < 1 OR p_window_seconds > 86400
  THEN
    RAISE EXCEPTION 'Invalid progressive throttle parameters.'
      USING ERRCODE = '22023';
  END IF;

  IF random() < 0.01 THEN
    DELETE FROM public.progressive_request_throttles
    WHERE last_attempt_at < now() - interval '30 days';
  END IF;

  INSERT INTO public.progressive_request_throttles (scope, key_hash)
  VALUES (p_scope, p_key_hash)
  ON CONFLICT (scope, key_hash) DO NOTHING;

  SELECT * INTO throttle
  FROM public.progressive_request_throttles
  WHERE scope = p_scope AND key_hash = p_key_hash
  FOR UPDATE;

  IF throttle.locked_until > now() THEN
    RETURN throttle.locked_until;
  END IF;

  IF throttle.last_attempt_at < now() - interval '24 hours' THEN
    UPDATE public.progressive_request_throttles
    SET attempt_count = 1,
        window_started_at = now(),
        lock_level = 0,
        locked_until = NULL,
        last_attempt_at = now()
    WHERE scope = p_scope AND key_hash = p_key_hash;
    RETURN NULL;
  END IF;

  IF throttle.window_started_at < now() - make_interval(secs => p_window_seconds) THEN
    next_count := 1;
    UPDATE public.progressive_request_throttles
    SET attempt_count = next_count,
        window_started_at = now(),
        locked_until = NULL,
        last_attempt_at = now()
    WHERE scope = p_scope AND key_hash = p_key_hash;
    RETURN NULL;
  END IF;

  next_count := throttle.attempt_count + 1;
  IF next_count <= p_limit THEN
    UPDATE public.progressive_request_throttles
    SET attempt_count = next_count,
        last_attempt_at = now()
    WHERE scope = p_scope AND key_hash = p_key_hash;
    RETURN NULL;
  END IF;

  next_level := throttle.lock_level + 1;
  lock_minutes := CASE
    WHEN next_level = 1 THEN 1
    WHEN next_level = 2 THEN 5
    WHEN next_level = 3 THEN 15
    ELSE least(1440, (30 * power(2, next_level - 4))::integer)
  END;

  UPDATE public.progressive_request_throttles
  SET attempt_count = 0,
      window_started_at = now(),
      lock_level = next_level,
      locked_until = now() + make_interval(mins => lock_minutes),
      last_attempt_at = now()
  WHERE scope = p_scope AND key_hash = p_key_hash
  RETURNING locked_until INTO throttle.locked_until;

  RETURN throttle.locked_until;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_progressive_request_throttle(
  p_scope text,
  p_key_hash text
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.progressive_request_throttles
  WHERE scope = p_scope AND key_hash = p_key_hash;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_progressive_request_throttle(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.clear_progressive_request_throttle(text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_progressive_request_throttle(text, text, integer, integer)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_progressive_request_throttle(text, text)
  TO service_role;
