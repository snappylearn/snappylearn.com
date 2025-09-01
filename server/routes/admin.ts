import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertTenantSchema } from "@shared/schema";
import { isAuthenticated, getUserId } from "../supabaseAuth";

// Admin authentication middleware
export const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = getUserId(req);
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

export function registerAdminRoutes(app: Express) {
  // Admin dashboard stats
  app.get("/api/admin/dashboard", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Tenant management
  app.get("/api/admin/tenants", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Fetch tenants error:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  app.post("/api/admin/tenants", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const tenantData = insertTenantSchema.parse(req.body);
      const tenant = await storage.createTenant(tenantData);
      
      // Log admin action
      await storage.logAdminAction({
        adminId: getUserId(req),
        action: 'create_tenant',
        targetType: 'tenant',
        targetId: tenant.id,
        details: { tenantName: tenant.name }
      });
      
      res.json(tenant);
    } catch (error) {
      console.error("Create tenant error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tenant data" });
      }
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });

  app.put("/api/admin/tenants/:id", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const tenant = await storage.updateTenant(id, updates);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      // Log admin action
      await storage.logAdminAction({
        adminId: getUserId(req),
        action: 'update_tenant',
        targetType: 'tenant',
        targetId: id,
        details: { tenantName: tenant.name, updates }
      });
      
      res.json(tenant);
    } catch (error) {
      console.error("Update tenant error:", error);
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  app.post("/api/admin/tenants/:id/activate", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = getUserId(req);
      const success = await storage.activateTenant(id, adminId);
      
      if (!success) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      res.json({ message: "Tenant activated successfully" });
    } catch (error) {
      console.error("Activate tenant error:", error);
      res.status(500).json({ error: "Failed to activate tenant" });
    }
  });

  app.post("/api/admin/tenants/:id/deactivate", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = getUserId(req);
      const success = await storage.deactivateTenant(id, adminId);
      
      if (!success) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      res.json({ message: "Tenant deactivated successfully" });
    } catch (error) {
      console.error("Deactivate tenant error:", error);
      res.status(500).json({ error: "Failed to deactivate tenant" });
    }
  });

  // User management
  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { tenantId, isActive } = req.query;
      const filters: any = {};
      
      if (tenantId) filters.tenantId = tenantId as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const users = await storage.getAllUsers(filters);
      res.json(users);
    } catch (error) {
      console.error("Fetch users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/activate", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = getUserId(req);
      const success = await storage.updateUserStatus(id, true, adminId);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "User activated successfully" });
    } catch (error) {
      console.error("Activate user error:", error);
      res.status(500).json({ error: "Failed to activate user" });
    }
  });

  app.post("/api/admin/users/:id/deactivate", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminId = getUserId(req);
      const success = await storage.updateUserStatus(id, false, adminId);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Deactivate user error:", error);
      res.status(500).json({ error: "Failed to deactivate user" });
    }
  });

  app.post("/api/admin/users/:id/role", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = getUserId(req);
      
      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      
      const success = await storage.updateUserRole(id, role, adminId);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Audit logs
  app.get("/api/admin/audit-logs", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { adminId, targetType, limit } = req.query;
      const filters: any = {};
      
      if (adminId) filters.adminId = adminId as string;
      if (targetType) filters.targetType = targetType as string;
      if (limit) filters.limit = parseInt(limit as string);
      
      const logs = await storage.getAdminAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Fetch audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // System health check
  app.get("/api/admin/health", isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        stats: {
          totalTenants: stats.totalTenants,
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
        }
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: "unhealthy", 
        error: "Database connection failed",
        timestamp: new Date().toISOString()
      });
    }
  });
}