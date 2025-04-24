import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { SESSION_CONFIG, DB_CONFIG } from "./config";
import { Pool } from 'pg';

// Global declaration for TypeScript passport integration
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Promisify scrypt for async password handling
const scryptAsync = promisify(scrypt);

/**
 * Securely hash a password using scrypt with salt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Securely compare stored password hash with supplied password
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Create a strong session secret
const generateStrongSecret = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Set up authentication for the application
 */
export function setupAuth(app: Express): void {
  // Configure session with maximally compatible settings
  const sessionSettings: session.SessionOptions = {
    name: 'campaign_session',
    secret: SESSION_CONFIG.secret,
    resave: true, // Must be true to ensure session is saved after each request
    saveUninitialized: false, // Should be false to prevent anonymous sessions
    store: storage.sessionStore,
    rolling: true, // Reset expiration on every response
    proxy: true, // Trust proxy settings when behind a reverse proxy
    cookie: {
      maxAge: SESSION_CONFIG.cookie.maxAge,
      httpOnly: true, // Prevent JavaScript access
      sameSite: SESSION_CONFIG.cookie.sameSite, // Use from config
      secure: SESSION_CONFIG.cookie.secure, // Use from config
      path: SESSION_CONFIG.cookie.path || '/'
    }
  };
  
  // Add domain if configured
  if (SESSION_CONFIG.cookie.domain) {
    sessionSettings.cookie!.domain = SESSION_CONFIG.cookie.domain;
  }
  
  // Log session configuration for debugging
  console.log(`Session configuration: secret=${SESSION_CONFIG.secret.substring(0, 3)}..., cookie.secure=${SESSION_CONFIG.cookie.secure}, cookie.sameSite=${SESSION_CONFIG.cookie.sameSite}`);
  console.log(`Using ${DB_CONFIG.url ? 'PostgreSQL' : 'Memory'} session store`);

  // Session handling middleware
  app.use(session(sessionSettings));
  
  // Initialize Passport authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up local authentication strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username
        const user = await storage.getUserByUsername(username);
        
        // Verify password if user exists
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Authentication successful
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  // Serialize user to session
  passport.serializeUser((user, done) => {
    // Only store user ID in session
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Retrieve full user object
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to log authentication state
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only log for API routes to avoid noise
    if (req.path.startsWith('/api/') && req.path !== '/api/user') {
      const authStatus = req.isAuthenticated() 
        ? `User authenticated (ID: ${req.user?.id})` 
        : 'User not authenticated';
      console.log(`${req.method} ${req.path}: ${authStatus}, Session: ${req.sessionID}`);
    }
    next();
  });

  /**
   * User registration endpoint
   */
  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input using Zod schema
      const validatedData = insertUserSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Check for existing username
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Create new user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Save session explicitly
        req.session.save((err) => {
          if (err) {
            return next(err);
          }
          
          // Return user data (without password)
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * User login endpoint with enhanced debugging
   */
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    // Validate request
    if (!req.body.username || !req.body.password) {
      console.log("Login attempt with missing credentials");
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    console.log(`Login attempt for username: ${req.body.username}`);
    
    // Check if the user is already logged in
    if (req.isAuthenticated() && req.user?.username === req.body.username) {
      console.log(`User ${req.body.username} is already logged in (Session ID: ${req.sessionID})`);
      const { password, ...userWithoutPassword } = req.user;
      return res.status(200).json(userWithoutPassword);
    }
    
    // Function to handle session cleanup for previous user sessions
    const cleanupPreviousSessions = async (userId: number): Promise<void> => {
      try {
        // Find all sessions in the database
        const pool = DB_CONFIG.url ? new Pool({ connectionString: DB_CONFIG.url }) 
          : new Pool({
            host: DB_CONFIG.host,
            port: parseInt(DB_CONFIG.port, 10),
            user: DB_CONFIG.user,
            password: DB_CONFIG.password,
            database: DB_CONFIG.database,
            ssl: { rejectUnauthorized: false }
          });
        
        // Check for existing sessions for this user
        // This is a simplified query - actual session format might vary
        const existingSessions = await pool.query(`
          SELECT sid FROM "session" 
          WHERE sess->'passport'->>'user' = $1 
            AND sid != $2
        `, [userId.toString(), req.sessionID]);
        
        // Delete old sessions for this user
        if (existingSessions.rows.length > 0) {
          const oldSessionIds = existingSessions.rows.map(row => row.sid);
          console.log(`Found ${oldSessionIds.length} previous sessions for user ID ${userId}, cleaning up...`);
          
          await pool.query(`
            DELETE FROM "session" WHERE sid = ANY($1::varchar[])
          `, [oldSessionIds]);
          
          console.log(`Cleaned up ${oldSessionIds.length} previous sessions for user ID ${userId}`);
        }
        
        await pool.end();
      } catch (error) {
        console.error("Error during session cleanup:", error);
        // Don't throw - this is just cleanup
      }
    };
    
    // Authenticate using passport
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log(`Authentication failed for ${req.body.username}: ${info?.message || "Invalid credentials"}`);
        return res.status(401).json({ 
          message: info?.message || "Invalid username or password" 
        });
      }
      
      console.log(`Authentication successful for user ${user.username} (ID: ${user.id})`);
      
      // Log user in
      req.login(user, (err) => {
        if (err) {
          console.error("Error in req.login:", err);
          return next(err);
        }
        
        // Regenerate session for security and to clean up
        req.session.regenerate((err) => {
          if (err) {
            console.error("Error regenerating session:", err);
            return next(err);
          }
          
          // Re-login after session regeneration
          req.login(user, (err) => {
            if (err) {
              console.error("Error in re-login after session regeneration:", err);
              return next(err);
            }
            
            // Save the new session
            req.session.save(async (err) => {
              if (err) {
                console.error("Error saving session:", err);
                return next(err);
              }
              
              console.log("Login successful - User ID:", user.id, "New Session ID:", req.sessionID);
              console.log("Session cookie details:", {
                name: 'campaign_session',
                secure: SESSION_CONFIG.cookie.secure,
                sameSite: SESSION_CONFIG.cookie.sameSite,
                path: SESSION_CONFIG.cookie.path,
                domain: SESSION_CONFIG.cookie.domain || 'not set'
              });
              
              // Clean up any previous sessions for this user (async)
              cleanupPreviousSessions(user.id).catch(console.error);
              
              // Return user without password
              const { password, ...userWithoutPassword } = user;
              res.status(200).json(userWithoutPassword);
            });
          });
        });
      });
    })(req, res, next);
  });

  /**
   * User logout endpoint
   */
  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(200).json({ message: "Already logged out" });
    }
    
    const sessionId = req.sessionID;
    const userId = req.user?.id;
    
    // Log out user (removes req.user)
    req.logout((err) => {
      if (err) return next(err);
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return next(err);
        }
        
        console.log(`Logout successful - User ID: ${userId}, Session destroyed: ${sessionId}`);
        
        // Clear cookie with same settings that were used to create it
        res.clearCookie('campaign_session', {
          path: SESSION_CONFIG.cookie.path,
          httpOnly: true,
          secure: SESSION_CONFIG.cookie.secure,
          sameSite: SESSION_CONFIG.cookie.sameSite,
          domain: SESSION_CONFIG.cookie.domain
        });
        
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  /**
   * Get current user endpoint with enhanced debugging
   */
  app.get("/api/user", (req: Request, res: Response, next: NextFunction) => {
    // Log request headers for debugging
    console.log("GET /api/user - Headers:", {
      cookie: req.headers.cookie ? 'Present' : 'Not present',
      sessionID: req.sessionID,
      hasSession: !!req.session,
      authenticated: req.isAuthenticated()
    });
    
    // Check for session but no authentication (possible timeout or invalid session)
    if (req.session && !req.isAuthenticated()) {
      console.log("Session exists but user is not authenticated. Possible session timeout.");
      
      // Try to regenerate session to fix potential issues
      return req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return next(err);
        }
        
        return res.status(401).json({ 
          authenticated: false,
          message: "Session expired. Please log in again."
        });
      });
    }
    
    // Not authenticated
    if (!req.isAuthenticated() || !req.user) {
      console.log("User not authenticated. Session ID:", req.sessionID);
      return res.status(401).json({ 
        authenticated: false,
        message: "Not authenticated" 
      });
    }
    
    // Authenticated - return user without password
    console.log("User authenticated. User ID:", req.user.id, "Session ID:", req.sessionID);
    const { password, ...userWithoutPassword } = req.user;
    
    // Save session to refresh expiry
    req.session.save((err) => {
      if (err) {
        console.error("Error refreshing session:", err);
        return next(err);
      }
      
      res.status(200).json({
        authenticated: true,
        user: userWithoutPassword
      });
    });
  });
}
