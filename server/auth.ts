import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || 'campaign-manager-secret-key';
  
  // Configure session to be stored properly
  const sessionSettings: session.SessionOptions = {
    name: 'campaign-session',
    secret: sessionSecret,
    resave: false, 
    saveUninitialized: false, // Only save on successful login
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production', // Set to true only in production with HTTPS
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input
      const validatedData = insertUserSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed for username:", req.body.username);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Trigger login and session creation
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }
        
        // Force session save
        if (req.session) {
          req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days
          req.session.save((err) => {
            if (err) {
              console.error("Session save error:", err);
              return next(err);
            }
            
            // Log the successful authentication
            console.log("User authenticated:", user.id, "Session ID:", req.sessionID);
            
            // Give the client access to key user information (without sensitive data like password)
            const safeUser = { ...user, password: undefined };
            return res.status(200).json(safeUser);
          });
        } else {
          // This shouldn't happen, but just in case
          console.error("Session object not available after login");
          return res.status(500).json({ message: "Authentication error" });
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const sessionId = req.sessionID;
    
    // First logout (removes req.user and clears the session)
    req.logout((err) => {
      if (err) return next(err);
      
      // Then destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return next(err);
        }
        
        console.log("User logged out. Session destroyed:", sessionId);
        
        // Clear the session cookie
        res.clearCookie('campaign-session');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("User not authenticated. Session ID:", req.sessionID);
      return res.sendStatus(401);
    }
    console.log("User authenticated. User ID:", req.user?.id, "Session ID:", req.sessionID);
    res.json(req.user);
  });
}
