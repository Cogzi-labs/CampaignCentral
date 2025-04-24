-- Create session table for persistent sessions
-- Run this only if the session table doesn't already exist

-- Check if the session table exists before creating it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'session'
  ) THEN
    -- Create the session table
    CREATE TABLE "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    );
    
    -- Create an index on the expire column for faster pruning
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    
    RAISE NOTICE 'Session table created successfully!';
  ELSE
    RAISE NOTICE 'Session table already exists. No changes made.';
  END IF;
END $$;