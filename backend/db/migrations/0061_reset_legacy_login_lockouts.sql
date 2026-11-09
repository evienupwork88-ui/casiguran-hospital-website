-- One-time reset for lockout state accumulated under the pre-0060 policy.
-- Applying this clears login/MFA lockouts and counters for every account.
UPDATE public.admin_login_throttles
SET failure_count = 0,
    window_started_at = now(),
    last_failure_at = now(),
    locked_until = NULL;
