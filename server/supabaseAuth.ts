import { type Express, type Request, type Response, type NextFunction, type RequestHandler } from "express";
import { supabase, supabaseUser } from "./lib/supabase";
import { storage } from "./storage";
import { configureSupabaseForDevelopment } from "./auth-config";

// Enhanced request type with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Get user ID from request (supports both Replit and Supabase auth)
export function getUserId(req: AuthenticatedRequest): string {
  if (req.user?.id) {
    return req.user.id;
  }
  
  // Fallback to session-based auth if available
  const session = (req as any).session;
  if (session?.user?.id) {
    return session.user.id;
  }
  
  throw new Error("User not authenticated");
}

// Middleware to authenticate requests using Supabase
export const isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabaseUser.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Ensure user exists in our database
    let dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      const userData = {
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
        lastName: user.user_metadata?.name?.split(' ').slice(1).join(' ') || null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
      };
      dbUser = await storage.upsertUser(userData);
    }

    // Add user to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || '',
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Setup Supabase auth routes
export async function setupSupabaseAuth(app: Express) {
  // Configure Supabase for development
  await configureSupabaseForDevelopment();
  // Get current user - DISABLED: Conflicts with custom auth
  // app.get("/api/auth/user", isAuthenticated, async (req: Request, res: Response) => {
  //   try {
  //     const userId = getUserId(req as AuthenticatedRequest);
  //     const user = await storage.getUser(userId);
  //     
  //     if (!user) {
  //       return res.status(404).json({ error: "User not found" });
  //     }
  //     
  //     res.json({
  //       id: user.id,
  //       email: user.email,
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //       profileImageUrl: user.profileImageUrl,
  //       role: user.role,
  //       isActive: user.isActive,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching user:", error);
  //     res.status(500).json({ error: "Failed to fetch user" });
  //   }
  // });

  // Sign out (client-side handled, but we can add server cleanup if needed)
  app.post("/api/auth/signout", (req: Request, res: Response) => {
    res.json({ message: "Signed out successfully" });
  });
}