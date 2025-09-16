import { Express } from "express";
import { z } from "zod";
import { notificationService } from "../services/notifications";
import { jwtAuth, getJwtUserId } from "./auth";
import { insertNotificationSchema } from "@shared/schema";
import { storage } from "../storage";

// Admin authentication middleware for JWT-based auth
export const requireAdminJwt = async (req: any, res: any, next: any) => {
  try {
    const userId = getJwtUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isAdmin = await storage.isAdmin(userId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export function registerNotificationRoutes(app: Express) {

  // POST /api/notifications - Queue a new notification
  app.post("/api/notifications", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      
      // Parse and validate the request body
      // SECURITY: Always use authenticated user ID, never allow userId override
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        userId: userId, // Force authenticated user ID - no override allowed
      });

      const notification = await notificationService.queueNotification(notificationData);
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid notification data", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // GET /api/notifications - Get notifications for the authenticated user
  app.get("/api/notifications", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const limit = parseInt(req.query.limit as string) || 20;
      
      const notifications = await notificationService.getUserNotifications(userId, limit);
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // GET /api/notifications/tenant/:tenantId - Get notifications for a tenant (admin only)
  app.get("/api/notifications/tenant/:tenantId", jwtAuth, requireAdminJwt, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const tenantId = req.params.tenantId;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // SECURITY: Admin access verified by requireAdminJwt middleware
      
      const notifications = await notificationService.getTenantNotifications(tenantId, limit);
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching tenant notifications:", error);
      res.status(500).json({ error: "Failed to fetch tenant notifications" });
    }
  });

  // PATCH /api/notifications/:id/retry - Retry a failed notification
  app.patch("/api/notifications/:id/retry", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      // SECURITY: Check if user owns the notification or is an admin
      const notification = await notificationService.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const isAdmin = await storage.isAdmin(userId);
      if (notification.userId !== userId && !isAdmin) {
        return res.status(403).json({ error: "Can only retry your own notifications or admin access required" });
      }
      
      await notificationService.retryNotification(notificationId);
      
      res.json({ message: "Notification retry initiated" });
    } catch (error) {
      console.error("Error retrying notification:", error);
      res.status(500).json({ error: "Failed to retry notification" });
    }
  });

  // POST /api/notifications/welcome - Send welcome email (for new user onboarding)
  app.post("/api/notifications/welcome", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { targetUserId, tenantId } = req.body;
      
      // SECURITY: Only admins can send to other users, regular users can only send to themselves
      // For now, restrict to current user only until proper RBAC is implemented
      const recipientUserId = userId; // Restrict to authenticated user only
      
      const notification = await notificationService.sendWelcomeEmail(recipientUserId, tenantId);
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error sending welcome email:", error);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  // POST /api/notifications/community-welcome - Send community welcome email
  app.post("/api/notifications/community-welcome", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { targetUserId, communityName, tenantId } = req.body;
      
      if (!communityName) {
        return res.status(400).json({ error: "Community name is required" });
      }
      
      // SECURITY: Only admins can send to other users, regular users can only send to themselves
      // For now, restrict to current user only until proper RBAC is implemented
      const recipientUserId = userId; // Restrict to authenticated user only
      
      const notification = await notificationService.sendCommunityWelcomeEmail(
        recipientUserId, 
        communityName, 
        tenantId
      );
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error sending community welcome email:", error);
      res.status(500).json({ error: "Failed to send community welcome email" });
    }
  });

  // POST /api/notifications/test - Test endpoint for sending test notifications (development only)
  app.post("/api/notifications/test", jwtAuth, async (req: any, res) => {
    // SECURITY: Restrict test endpoint to development environment only
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Test endpoint not available in production" });
    }
    try {
      const userId = getJwtUserId(req);
      
      const testNotification = await notificationService.queueNotification({
        userId,
        channel: 'email',
        payload: {
          subject: 'Test Email from SnappyLearn',
          body: 'This is a test email to verify the notification system is working correctly.',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #7c3aed;">Test Email ✅</h1>
              <p>This is a test email to verify the notification system is working correctly.</p>
              <p>If you received this, the notification system is functioning properly!</p>
              <p><strong>SnappyLearn Notification System</strong></p>
            </div>
          `
        },
        provider: 'custom_inbuilt'
      });
      
      res.status(201).json({
        message: "Test notification sent successfully",
        notification: testNotification
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });
}