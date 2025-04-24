-- Create session table for persistent sessions
-- This migration adds the session table for Connect PG Simple session storage

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");