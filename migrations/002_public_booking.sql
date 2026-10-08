CREATE TABLE IF NOT EXISTS public_limits (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 window_start TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS public_limits_window_idx ON public_limits(window_start);
