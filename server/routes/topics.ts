import type { Express } from "express";
import { db } from "../db";
import { topics, insertTopicSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerTopicRoutes(app: Express) {
  
  // Get all topics
  app.get("/api/topics", async (req, res) => {
    try {
      const allTopics = await db
        .select()
        .from(topics)
        .where(eq(topics.isActive, true))
        .orderBy(topics.name);

      res.json(allTopics);
    } catch (error) {
      console.error("Error fetching topics:", error);
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  // Create new topic (admin only)
  app.post("/api/topics", async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const validatedData = insertTopicSchema.parse(req.body);
      
      const [topic] = await db
        .insert(topics)
        .values(validatedData)
        .returning();

      res.json(topic);
    } catch (error) {
      console.error("Error creating topic:", error);
      res.status(500).json({ error: "Failed to create topic" });
    }
  });

  // Get topic by slug
  app.get("/api/topics/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      const [topic] = await db
        .select()
        .from(topics)
        .where(eq(topics.slug, slug))
        .limit(1);

      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }

      res.json(topic);
    } catch (error) {
      console.error("Error fetching topic:", error);
      res.status(500).json({ error: "Failed to fetch topic" });
    }
  });
}