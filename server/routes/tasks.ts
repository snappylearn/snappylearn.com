import type { Express } from "express";
import { jwtAuth, getJwtUserId } from "./auth";
import { storage } from "../storage";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export function registerTaskRoutes(app: Express) {
  // Get all tasks for the authenticated user
  app.get("/api/tasks", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Get a specific task
  app.get("/api/tasks/:id", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      const task = await storage.getTask(id, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  // Create a new task
  app.post("/api/tasks", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      
      // Validate request body
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        userId,
      });

      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  // Update a task
  app.put("/api/tasks/:id", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      // Validate request body (partial update)
      const updateSchema = insertTaskSchema.partial().omit({ userId: true });
      const validatedData = updateSchema.parse(req.body);

      const task = await storage.updateTask(id, validatedData, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      const success = await storage.deleteTask(id, userId);
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Toggle task active status
  app.patch("/api/tasks/:id/toggle", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      // Get current task to toggle status
      const currentTask = await storage.getTask(id, userId);
      if (!currentTask) {
        return res.status(404).json({ error: "Task not found" });
      }

      const task = await storage.updateTask(id, { isActive: !currentTask.isActive }, userId);
      res.json(task);
    } catch (error) {
      console.error("Error toggling task:", error);
      res.status(500).json({ error: "Failed to toggle task" });
    }
  });

  // Get task runs for a specific task
  app.get("/api/tasks/:id/runs", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const taskId = parseInt(req.params.id);
      
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }

      // First verify the task belongs to the user
      const task = await storage.getTask(taskId, userId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const runs = await storage.getTaskRuns(taskId);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching task runs:", error);
      res.status(500).json({ error: "Failed to fetch task runs" });
    }
  });
}