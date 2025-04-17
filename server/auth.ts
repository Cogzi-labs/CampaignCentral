import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { SESSION_CONFIG } from "./config";

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
  // Configure session with enhanced settings for persistence
  const sessionSettings: session.SessionOptions = {
    name: 'campaign_session',
    secret: SESSION_CONFIG.secret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    rolling: true, // Reset expiration on every response
    proxy: true, // Trust proxy settings when behind a reverse proxy
    cookie: {
      maxAge: SESSION_CONFIG.cookie.maxAge,
      httpOnly: true, // Prevent JavaScript access
      sameSite: 'lax', // More compatible setting for testing
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      path: '/',
      domain: undefined // Let browser determine domain
    }
  };
  
  // Log session configuration for debugging
  console.log(`Session configuration: secret=${SESSION_CONFIG.secret.substring(0, 3)}..., cookie.secure=${SESSION_CONFIG.cookie.secure}, cookie.sameSite=${SESSION_CONFIG.cookie.sameSite}`);
  console.log(`Using ${process.env.DATABASE_URL ? 'PostgreSQL' : 'Memory'} session store`);

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
   * User login endpoint
   */
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    // Validate request
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Authenticate using passport
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Invalid username or password" 
        });
      }
      
      // Log user in
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Explicitly save session with regenerated ID
        req.session.regenerate((err) => {
          if (err) {
            return next(err);
          }
          
          // Save session again with the user
          req.session.save((err) => {
            if (err) {
              return next(err);
            }
            
            console.log("Login successful - User ID:", user.id, "Session ID:", req.sessionID);
            
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            res.status(200).json(userWithoutPassword);
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
        
        // Clear cookie
        res.clearCookie('campaign_session');
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  /**
   * Get current user endpoint
   */
  app.get("/api/user", (req: Request, res: Response) => {
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
    res.status(200).json({
      authenticated: true,
      user: userWithoutPassword
    });
  });
}
