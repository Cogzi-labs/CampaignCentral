#!/usr/bin/env node

/**
 * Session Cleanup Script
 * 
 * This script removes expired sessions from the session table in PostgreSQL.
 * It can be run manually or set up as a cron job to run periodically.
 * 
 * Usage:
 *   node scripts/cleanup_sessions.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Get database connection info from environment variables
const connectionConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl: {
        rejectUnauthorized: false
      }
    };

if (!process.env.DATABASE_URL && 
    !(process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE)) {
  console.error('Database connection information must be set in environment variables');
  process.exit(1);
}

async function cleanupSessions() {
  const pool = new Pool(connectionConfig);
  
  try {
    console.log('Connecting to database...');
    await pool.connect();
    
    console.log('Checking session table...');
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session'
      );
    `);
    
    if (!checkTableResult.rows[0].exists) {
      console.log('Session table does not exist. Nothing to clean up.');
      return;
    }
    
    // Count total sessions
    const countResult = await pool.query('SELECT COUNT(*) FROM "session";');
    const totalSessions = parseInt(countResult.rows[0].count);
    
    console.log(`Found ${totalSessions} sessions in total.`);
    
    // Count expired sessions
    const expiredCountResult = await pool.query('SELECT COUNT(*) FROM "session" WHERE expire < NOW();');
    const expiredSessions = parseInt(expiredCountResult.rows[0].count);
    
    console.log(`Found ${expiredSessions} expired sessions.`);
    
    if (expiredSessions > 0) {
      // Delete expired sessions
      const deleteResult = await pool.query('DELETE FROM "session" WHERE expire < NOW();');
      console.log(`Deleted ${deleteResult.rowCount} expired sessions.`);
    } else {
      console.log('No expired sessions to delete.');
    }
    
    // Optional: Find duplicate sessions for the same user
    // This is a more advanced cleanup that helps when there are multiple sessions for the same user
    console.log('\nChecking for duplicate sessions...');
    const duplicatesResult = await pool.query(`
      SELECT DISTINCT s1.sid, s1.sess->>'passport' as passport_data
      FROM "session" s1
      JOIN "session" s2 ON 
        s1.sid != s2.sid AND 
        s1.sess->>'passport' = s2.sess->>'passport' AND
        s1.sess->>'passport' IS NOT NULL
      ORDER BY s1.expire DESC;
    `);
    
    if (duplicatesResult.rows.length > 0) {
      console.log(`Found ${duplicatesResult.rows.length} duplicate sessions for the same users.`);
      
      // Keep only the most recent session for each user
      const duplicateSessions = duplicatesResult.rows.map(r => r.sid);
      
      if (duplicateSessions.length > 0) {
        // Get the most recent session for each user to keep
        const keepSessionsResult = await pool.query(`
          WITH ranked_sessions AS (
            SELECT sid, sess->>'passport' as passport_data, expire,
            ROW_NUMBER() OVER (PARTITION BY sess->>'passport' ORDER BY expire DESC) as rn
            FROM "session"
            WHERE sess->>'passport' IS NOT NULL
          )
          SELECT sid FROM ranked_sessions WHERE rn = 1;
        `);
        
        const keepSessions = keepSessionsResult.rows.map(r => `'${r.sid}'`).join(',');
        
        // Delete all other sessions for these users
        if (keepSessions.length > 0) {
          const deleteDuplicatesResult = await pool.query(`
            DELETE FROM "session" 
            WHERE sess->>'passport' IS NOT NULL
            AND sid NOT IN (${keepSessions});
          `);
          
          console.log(`Deleted ${deleteDuplicatesResult.rowCount} duplicate sessions, keeping only the most recent one for each user.`);
        }
      }
    } else {
      console.log('No duplicate sessions found.');
    }
    
    // Count final sessions
    const finalCountResult = await pool.query('SELECT COUNT(*) FROM "session";');
    const finalSessions = parseInt(finalCountResult.rows[0].count);
    
    console.log(`\nSession cleanup complete. ${totalSessions - finalSessions} sessions removed.`);
    console.log(`Sessions in database now: ${finalSessions}`);
    
  } catch (error) {
    console.error('Error during session cleanup:', error);
  } finally {
    await pool.end();
  }
}

cleanupSessions();