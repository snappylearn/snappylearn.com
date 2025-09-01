import { type Express, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function setupAuthRoutes(app: Express) {
  // Sign up route - creates user in our database
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = signUpSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user in our database
      const userId = crypto.randomUUID();
      const newUser = await storage.createUser({
        id: userId,
        email,
        passwordHash,
        emailVerified: true, // Auto-verify for development
        role: "user",
        isActive: true,
      });

      console.log("User created successfully:", newUser.email);

      res.json({ 
        success: true, 
        message: "Account created successfully! You can now sign in.",
        userId: newUser.id 
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Sign in route - authenticates user and returns JWT
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const { email, password } = signInSchema.parse(req.body);
      
      // Get user from database
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if user has a password hash
      if (!user.passwordHash) {
        return res.status(401).json({ error: "Please use Google sign-in for this account" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: "Account is deactivated" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log("User signed in successfully:", user.email);

      res.json({ 
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        }
      });
    } catch (error) {
      console.error("Signin error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User endpoint - validates JWT and returns user data
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      console.log("Auth header received:", authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : "None");
      
      if (!authHeader?.startsWith('Bearer ')) {
        console.log("Invalid auth header format");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(' ')[1];
      console.log("Token received, attempting JWT verification");
      
      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
        console.log("JWT verified successfully for user:", decoded.email);
      } catch (jwtError: any) {
        console.log("JWT verification failed:", jwtError.message);
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Get user from database
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        console.log("User not found in database:", decoded.userId);
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user is still active
      if (!user.isActive) {
        console.log("User account is deactivated:", user.email);
        return res.status(401).json({ error: "Account is deactivated" });
      }

      console.log("Authentication successful for user:", user.email);
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      });
    } catch (error) {
      console.error("User validation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Sign out route (for completeness)
  app.post("/api/auth/signout", async (req: Request, res: Response) => {
    // With JWT, we don't need to do anything server-side for logout
    // The client will simply remove the token
    res.json({ success: true, message: "Signed out successfully" });
  });
}

// JWT Authentication Middleware
export const jwtAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    } catch (jwtError: any) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user from database
    const user = await storage.getUser(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Add user to request object
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error("JWT auth error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Get user ID helper function  
export const getJwtUserId = (req: any): string => {
  return req.userId;
};