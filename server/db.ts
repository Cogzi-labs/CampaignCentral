import { DB_CONFIG } from './config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Try to connect using individual parameters if available, otherwise fall back to connection string
const connectionConfig = DB_CONFIG.host && DB_CONFIG.user && DB_CONFIG.password && DB_CONFIG.database
  ? {
      host: DB_CONFIG.host,
      port: parseInt(DB_CONFIG.port || '5432', 10),
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: DB_CONFIG.database,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : { connectionString: DB_CONFIG.url };

if (!DB_CONFIG.url && !(DB_CONFIG.host && DB_CONFIG.user && DB_CONFIG.password && DB_CONFIG.database)) {
  throw new Error(
    "Database connection information must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });