import type { Express } from "express";
import { db } from "../db";
import { follows, users, insertFollowSchema } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export function registerFollowRoutes(app: Express) {
  
  // Follow/unfollow a user
  app.post("/api/users/:id/follow", async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const followingId = req.params.id;

      if (userId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      // Check if already following
      const existingFollow = await db
        .select()
        .from(follows)
        .where(and(
          eq(follows.followerId, userId),
          eq(follows.followingId, followingId)
        ))
        .limit(1);

      if (existingFollow.length > 0) {
        // Unfollow
        await db
          .delete(follows)
          .where(and(
            eq(follows.followerId, userId),
            eq(follows.followingId, followingId)
          ));
        res.json({ following: false });
      } else {
        // Follow
        await db
          .insert(follows)
          .values({
            followerId: userId,
            followingId,
          });
        res.json({ following: true });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ error: "Failed to toggle follow" });
    }
  });

  // Get user's followers
  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = req.params.id;

      const followers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .leftJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, userId));

      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  // Get user's following
  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = req.params.id;

      const following = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          followedAt: follows.createdAt,
        })
        .from(follows)
        .leftJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, userId));

      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  // Get follow statistics for a user
  app.get("/api/users/:id/follow-stats", async (req, res) => {
    try {
      const userId = req.params.id;

      const [followerCount, followingCount] = await Promise.all([
        db
          .select({ count: sql<number>`CAST(COUNT(*) as INTEGER)` })
          .from(follows)
          .where(eq(follows.followingId, userId)),
        
        db
          .select({ count: sql<number>`CAST(COUNT(*) as INTEGER)` })
          .from(follows)
          .where(eq(follows.followerId, userId))
      ]);

      res.json({
        followerCount: followerCount[0]?.count || 0,
        followingCount: followingCount[0]?.count || 0,
      });
    } catch (error) {
      console.error("Error fetching follow stats:", error);
      res.status(500).json({ error: "Failed to fetch follow stats" });
    }
  });
}