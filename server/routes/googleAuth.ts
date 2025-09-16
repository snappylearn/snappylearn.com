import type { Express } from "express";
// Google Auth setup - no longer using Supabase
import { storage } from "../storage";

export function setupGoogleAuth(app: Express) {
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;
      
      if (!credential) {
        return res.status(400).json({ error: "Google credential is required" });
      }

      // Decode the JWT credential from Google
      let userInfo;
      try {
        console.log("Received credential:", credential.substring(0, 100) + "...");
        
        // JWT has 3 parts separated by dots: header.payload.signature
        const parts = credential.split('.');
        console.log("JWT parts count:", parts.length);
        
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        
        // Decode the payload (middle part) - JWT uses base64url encoding
        const payload = parts[1];
        console.log("Payload length:", payload.length);
        
        // Convert base64url to base64 by replacing URL-safe characters
        const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed for base64 decoding
        const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
        
        console.log("Attempting to decode payload...");
        const decodedPayload = Buffer.from(paddedPayload, 'base64').toString();
        console.log("Decoded payload:", decodedPayload.substring(0, 100) + "...");
        
        userInfo = JSON.parse(decodedPayload);
        console.log("Parsed user info:", { email: userInfo.email, name: userInfo.name });
      } catch (error) {
        console.error("Failed to decode JWT credential:", error);
        return res.status(400).json({ error: "Invalid credential format" });
      }

      console.log("Processing Google login for user:", userInfo.email);

      // First, check if a user with this email already exists in our database
      console.log("Checking for existing user with email:", userInfo.email);
      const existingUserByEmail = await storage.getUserByEmail(userInfo.email || '');
      console.log("Found existing user by email:", !!existingUserByEmail, existingUserByEmail?.id);
      
      if (existingUserByEmail) {
        // User exists with this email, use the existing one
        const dbUser = existingUserByEmail;
        console.log("Using existing user by email:", dbUser.email);
        
        // For existing users, we'll use the database user and create a simple session
        console.log("Returning session for existing user");
        
        try {
          // Return session for existing user
          const responseData = {
            access_token: `snappy_${dbUser.id}_${Date.now()}`, // Simple token for existing users
            refresh_token: `refresh_${dbUser.id}_${Date.now()}`,
            user: {
              id: dbUser.id,
              email: dbUser.email,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              profileImageUrl: dbUser.profileImageUrl,
            },
          };
          
          console.log("Sending response:", JSON.stringify(responseData, null, 2));
          res.json(responseData);
          return;
        } catch (error) {
          console.error("Error generating session for existing user:", error);
          return res.status(500).json({ error: "Failed to generate session for existing user" });
        }
      }
      
      // For new users, continue with Supabase authentication
      console.log("New user, continuing with Supabase auth");
      
      // Try to sign in with existing user in Supabase
      console.log("Attempting to sign in with email:", userInfo.email);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userInfo.email,
        password: userInfo.sub // Use Google sub as a unique identifier
      });

      console.log("Sign in error:", !!signInError, signInError?.message);
      console.log("Sign in data:", !!signInData, !!signInData?.user, !!signInData?.session);

      let user;
      let sessionData;

      if (signInError) {
        // User doesn't exist, create a new one
        console.log("Creating new user with email:", userInfo.email);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userInfo.email,
          password: userInfo.sub, // Use Google sub as a unique identifier
          options: {
            data: {
              name: userInfo.name,
              avatar_url: userInfo.picture,
              provider: 'google',
            }
          }
        });

        console.log("Sign up error:", !!signUpError, signUpError?.message);
        console.log("Sign up data:", !!signUpData, !!signUpData?.user, !!signUpData?.session);

        if (signUpError) {
          console.error("User creation error:", signUpError);
          return res.status(500).json({ error: "Failed to create user" });
        }

        user = signUpData.user;
        sessionData = signUpData.session;
      } else {
        user = signInData.user;
        sessionData = signInData.session;
      }

      if (!user) {
        return res.status(500).json({ error: "Authentication failed" });
      }
      
      // Check if Supabase user exists in our database
      let dbUser = await storage.getUser(user.id);
      console.log("Supabase user lookup by ID:", user.id, "found:", !!dbUser);
      
      if (!dbUser) {
        // Create new user in our database
        console.log("Creating new user with ID:", user.id);
        dbUser = await storage.upsertUser({
          id: user.id,
          email: user.email || '',
          firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || user.email?.split('@')[0] || 'User',
          lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: userInfo.picture || null,
        });
      }
      
      if (!sessionData) {
        return res.status(500).json({ error: "Failed to generate session" });
      }

      // Return the session tokens for the frontend
      // Use the database user instead of the Supabase user for consistency
      res.json({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
        },
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}