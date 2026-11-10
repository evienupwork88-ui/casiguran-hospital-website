ALTER TABLE public.admin_change_requests
  ADD COLUMN IF NOT EXISTS requester_read_at timestamptz;

CREATE INDEX IF NOT EXISTS admin_change_requests_rejected_unread_idx
  ON public.admin_change_requests (requester_id, decided_at DESC)
  WHERE status = 'rejected' AND requester_read_at IS NULL;
