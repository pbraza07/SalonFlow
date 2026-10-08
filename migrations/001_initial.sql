CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY,
 email TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
 key TEXT PRIMARY KEY,
 count INTEGER NOT NULL,
 window_start TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (owner TEXT PRIMARY KEY REFERENCES users(id),data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS appointments (
 id TEXT PRIMARY KEY,
 owner TEXT NOT NULL REFERENCES users(id),
 date TEXT NOT NULL,
 staff TEXT NOT NULL,
 start INTEGER NOT NULL,
 duration INTEGER NOT NULL,
 data TEXT NOT NULL,
 status TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS appointments_owner_date_idx ON appointments(owner,date,start);
CREATE TABLE IF NOT EXISTS slots (
 owner TEXT NOT NULL REFERENCES users(id),
 date TEXT NOT NULL,
 staff TEXT NOT NULL,
 minute INTEGER NOT NULL,
 appointment TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
 PRIMARY KEY(owner,date,staff,minute)
);
CREATE INDEX IF NOT EXISTS slots_appointment_idx ON slots(owner,appointment);
CREATE TABLE IF NOT EXISTS events (
 id TEXT PRIMARY KEY,
 owner TEXT NOT NULL REFERENCES users(id),
 created TEXT NOT NULL,
 kind TEXT NOT NULL,
 data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_owner_created_idx ON events(owner,created);
