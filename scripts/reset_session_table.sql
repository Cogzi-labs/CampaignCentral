-- Drop and recreate session table script
-- This ensures we start with a fresh session table

-- Drop the session table if it exists
DROP TABLE IF EXISTS "session";

-- Create the session table
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Create an index on the expire column for faster pruning
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");