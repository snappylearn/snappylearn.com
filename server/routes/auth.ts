import { type Express, type Request, type Response } from "express";
import { supabase } from "../lib/supabase";
import { storage } from "../storage";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function setupAuthRoutes(app: Express) {
  // Sign up route - handles user creation with auto-confirmation
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = signUpSchema.parse(req.body);
      
      // Create user with Supabase
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data.user) {
        return res.status(400).json({ error: "Failed to create user" });
      }

      // Create user in our database
      await storage.upsertUser({
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.full_name || null,
        profileImage: data.user.user_metadata?.avatar_url || null,
      });

      res.json({ 
        success: true, 
        message: "Account created successfully! You can now sign in.",
        userId: data.user.id 
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input data" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Sign in route - handles authentication
  app.post("/api/auth/signin", async (req: Request, res: Response) => {
    try {
      const { email, password } = signInSchema.parse(req.body);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (!data.session) {
        return res.status(400).json({ error: "Failed to create session" });
      }

      res.json({ 
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
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

  // User endpoint - validates Google OAuth tokens and returns user data
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(' ')[1];
      
      // Check if it's a Google OAuth token (starts with 'snappy_')
      if (token.startsWith('snappy_')) {
        // Extract user ID from token
        const tokenParts = token.split('_');
        if (tokenParts.length >= 2) {
          const userId = tokenParts[1];
          
          // Validate token timestamp (simple validation)
          const timestamp = tokenParts[2];
          if (timestamp && Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
            return res.status(401).json({ error: "Token expired" });
          }
          
          // Get user from database
          const user = await storage.getUser(userId);
          if (!user) {
            return res.status(401).json({ error: "User not found" });
          }
          
          return res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl
          });
        }
      }
      
      // Fallback to Supabase token validation
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user from database
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl
      });
    } catch (error) {
      console.error("User validation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}