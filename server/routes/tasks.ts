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

  // Execute a task manually
  app.post("/api/tasks/:id/run", jwtAuth, async (req: any, res) => {
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

      // Execute the task
      const startTime = new Date();
      let status = 'completed';
      let output = '';
      let errorMessage = null;
      let duration = 0;

      try {
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: task.prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        const endTime = new Date();
        duration = endTime.getTime() - startTime.getTime();

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        output = data.choices[0]?.message?.content || 'No response generated';

      } catch (error) {
        const endTime = new Date();
        duration = endTime.getTime() - startTime.getTime();
        status = 'failed';
        errorMessage = error.message || 'Unknown error occurred';
        console.error('Task execution failed:', error);
      }

      // Save the task run
      const taskRun = await storage.createTaskRun({
        taskId,
        status,
        startTime,
        duration,
        output: output || null,
        errorMessage,
      });

      // Update task's lastRun timestamp
      await storage.updateTask(taskId, { lastRun: startTime }, userId);

      res.json(taskRun);
    } catch (error) {
      console.error("Error executing task:", error);
      res.status(500).json({ error: "Failed to execute task" });
    }
  });
}