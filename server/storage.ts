import {
  users,
  collections,
  documents,
  collectionDocuments,
  conversations,
  messages,
  artifacts,
  tenants,
  adminAuditLog,
  type User,
  type UpsertUser,
  type InsertUser,
  type Collection,
  type InsertCollection,
  type Document,
  type InsertDocument,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Artifact,
  type InsertArtifact,
  type Tenant,
  type InsertTenant,
  type AdminAuditLog,
  type InsertAdminAuditLog,
  type CollectionWithStats,
  type ConversationWithPreview,
  type TenantWithStats,
  type UserWithTenant,
  type AdminDashboardStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and } from "drizzle-orm";

export interface IStorage {
  // User methods - required for multi-provider Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getPublicUsers(): Promise<User[]>;

  // Collection methods
  getCollections(userId: string): Promise<CollectionWithStats[]>;
  getCollection(id: number, userId: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, updates: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number, userId: string): Promise<boolean>;

  // Document methods
  getDocuments(collectionId: number, userId?: string): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number, userId?: string): Promise<boolean>;

  // Conversation methods
  getConversations(userId: string): Promise<ConversationWithPreview[]>;
  getConversation(id: number, userId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number, userId: string): Promise<boolean>;

  // Message methods
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Artifact methods
  getArtifacts(userId: string, filters?: { type?: string; collectionId?: number }): Promise<Artifact[]>;
  getArtifact(id: number, userId?: string): Promise<Artifact | undefined>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  updateArtifact(id: number, updates: Partial<InsertArtifact>): Promise<Artifact | undefined>;
  deleteArtifact(id: number, userId: string): Promise<boolean>;

  // Admin methods
  isAdmin(userId: string): Promise<boolean>;
  getAdminDashboardStats(): Promise<AdminDashboardStats>;
  getTenants(): Promise<TenantWithStats[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant | undefined>;
  activateTenant(id: string, adminId: string): Promise<boolean>;
  deactivateTenant(id: string, adminId: string): Promise<boolean>;
  getAllUsers(filters?: { tenantId?: string; isActive?: boolean }): Promise<UserWithTenant[]>;
  updateUserStatus(userId: string, isActive: boolean, adminId: string): Promise<boolean>;
  updateUserRole(userId: string, role: string, adminId: string): Promise<boolean>;
  logAdminAction(log: InsertAdminAuditLog): Promise<AdminAuditLog>;
  getAdminAuditLogs(filters?: { adminId?: string; targetType?: string; limit?: number }): Promise<AdminAuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations - required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // First try to find existing user by email or id
      let existingUser = await this.getUser(userData.id);
      if (!existingUser && userData.email) {
        existingUser = await this.getUserByEmail(userData.email);
      }

      if (existingUser) {
        // Update existing user
        const [user] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return user;
      } else {
        // Create new user
        const [user] = await db
          .insert(users)
          .values(userData)
          .returning();
        return user;
      }
    } catch (error) {
      console.error("Error upserting user:", error);
      // If it's a duplicate key error, try to get the existing user
      if ((error as any).code === '23505') {
        const existingUser = userData.email ? 
          await this.getUserByEmail(userData.email) : 
          await this.getUser(userData.id);
        if (existingUser) {
          return existingUser;
        }
      }
      throw error;
    }
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPublicUsers(): Promise<User[]> {
    const publicUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(desc(users.createdAt));
    return publicUsers;
  }

  // Collection methods
  async getCollections(userId: string): Promise<CollectionWithStats[]> {
    const collectionsWithStats = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        userId: collections.userId,
        privateStatusTypeId: collections.privateStatusTypeId,
        isDefault: collections.isDefault,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        documentCount: count(collectionDocuments.documentId),
      })
      .from(collections)
      .leftJoin(collectionDocuments, eq(collections.id, collectionDocuments.collectionId))
      .where(eq(collections.userId, userId))
      .groupBy(collections.id)
      .orderBy(desc(collections.updatedAt));

    return collectionsWithStats.map(collection => ({
      ...collection,
      documentCount: collection.documentCount || 0,
    }));
  }

  async getCollection(id: number, userId: string): Promise<Collection | undefined> {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, id) && eq(collections.userId, userId));
    return collection || undefined;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async updateCollection(id: number, updates: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [collection] = await db
      .update(collections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(collections.id, id))
      .returning();
    return collection || undefined;
  }

  async deleteCollection(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Document methods
  async getDocuments(collectionId: number, userId?: string): Promise<Document[]> {
    // If userId is provided, validate collection ownership
    if (userId) {
      const collection = await this.getCollection(collectionId, userId);
      if (!collection) {
        return []; // Return empty array if user doesn't own the collection
      }
    }
    
    return await db
      .select({
        id: documents.id,
        name: documents.name,
        content: documents.content,
        mimeType: documents.mimeType,
        size: documents.size,
        type: documents.type,
        sourcePostId: documents.sourcePostId,
        userId: documents.userId,
        uploadedAt: documents.uploadedAt,
      })
      .from(documents)
      .innerJoin(collectionDocuments, eq(documents.id, collectionDocuments.documentId))
      .where(eq(collectionDocuments.collectionId, collectionId))
      .orderBy(desc(documents.uploadedAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async deleteDocument(id: number, userId?: string): Promise<boolean> {
    // If userId is provided, validate document ownership
    if (userId) {
      const document = await this.getDocument(id);
      if (!document || document.userId !== userId) {
        return false; // Document doesn't exist or user doesn't own it
      }
    }
    
    // Delete from junction table first
    await db.delete(collectionDocuments).where(eq(collectionDocuments.documentId, id));
    
    // Then delete the document
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Conversation methods
  async getConversations(userId: string): Promise<ConversationWithPreview[]> {
    const conversationsWithPreview = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        type: conversations.type,
        collectionId: conversations.collectionId,
        userId: conversations.userId,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        messageCount: count(messages.id),
        lastMessage: sql<string>`(
          SELECT content 
          FROM ${messages} 
          WHERE ${messages.conversationId} = ${conversations.id} 
          ORDER BY ${messages.createdAt} DESC 
          LIMIT 1
        )`,
      })
      .from(conversations)
      .leftJoin(messages, eq(conversations.id, messages.conversationId))
      .where(eq(conversations.userId, userId))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt));

    return conversationsWithPreview.map(conv => ({
      ...conv,
      preview: conv.lastMessage || "No messages yet",
      messageCount: conv.messageCount || 0,
      lastMessage: conv.lastMessage || undefined,
    }));
  }

  async getConversation(id: number, userId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id) && eq(conversations.userId, userId));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async deleteConversation(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, id) && eq(conversations.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }

  // Message methods
  async getMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  // Artifact methods
  async getArtifacts(userId: string, filters?: { type?: string; collectionId?: number }): Promise<Artifact[]> {
    let query = db
      .select()
      .from(artifacts)
      .where(eq(artifacts.userId, userId));
    
    if (filters?.type) {
      query = query.where(eq(artifacts.type, filters.type));
    }
    
    if (filters?.collectionId) {
      query = query.where(eq(artifacts.collectionId, filters.collectionId));
    }
    
    const results = await query.orderBy(desc(artifacts.createdAt));
    return results;
  }

  async getArtifact(id: number, userId?: string): Promise<Artifact | undefined> {
    let query = db
      .select()
      .from(artifacts)
      .where(eq(artifacts.id, id));
    
    if (userId) {
      query = query.where(eq(artifacts.userId, userId));
    }
    
    const [artifact] = await query;
    return artifact || undefined;
  }

  async createArtifact(insertArtifact: InsertArtifact): Promise<Artifact> {
    const [artifact] = await db
      .insert(artifacts)
      .values(insertArtifact)
      .returning();
    return artifact;
  }

  async updateArtifact(id: number, updates: Partial<InsertArtifact>): Promise<Artifact | undefined> {
    const [artifact] = await db
      .update(artifacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(artifacts.id, id))
      .returning();
    return artifact || undefined;
  }

  async deleteArtifact(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(artifacts)
      .where(and(eq(artifacts.id, id), eq(artifacts.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Admin methods implementation
  async isAdmin(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));
    return user?.role === 'admin' || user?.role === 'super_admin';
  }

  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const [tenantsCount] = await db
      .select({ count: count() })
      .from(tenants);
    
    const [activeTenantsCount] = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.isActive, true));
    
    const [usersCount] = await db
      .select({ count: count() })
      .from(users);
    
    const [activeUsersCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));
    
    const [collectionsCount] = await db
      .select({ count: count() })
      .from(collections);
    
    const [documentsCount] = await db
      .select({ count: count() })
      .from(documents);
    
    const [conversationsCount] = await db
      .select({ count: count() })
      .from(conversations);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [newUsersCount] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`);

    return {
      totalTenants: tenantsCount.count,
      activeTenants: activeTenantsCount.count,
      totalUsers: usersCount.count,
      activeUsers: activeUsersCount.count,
      totalCollections: collectionsCount.count,
      totalDocuments: documentsCount.count,
      totalConversations: conversationsCount.count,
      newUsersThisMonth: newUsersCount.count,
      recentActivity: []
    };
  }

  async getTenants(): Promise<TenantWithStats[]> {
    const tenantsList = await db
      .select()
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    const tenantsWithStats = await Promise.all(
      tenantsList.map(async (tenant) => {
        const [userCount] = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.tenantId, tenant.id));
        
        const [collectionCount] = await db
          .select({ count: count() })
          .from(collections)
          .leftJoin(users, eq(users.id, collections.userId))
          .where(eq(users.tenantId, tenant.id));
        
        const [documentCount] = await db
          .select({ count: count() })
          .from(documents)
          .leftJoin(collections, eq(collections.id, documents.collectionId))
          .leftJoin(users, eq(users.id, collections.userId))
          .where(eq(users.tenantId, tenant.id));
        
        const [conversationCount] = await db
          .select({ count: count() })
          .from(conversations)
          .leftJoin(users, eq(users.id, conversations.userId))
          .where(eq(users.tenantId, tenant.id));

        return {
          ...tenant,
          userCount: userCount.count,
          collectionCount: collectionCount.count,
          documentCount: documentCount.count,
          conversationCount: conversationCount.count,
        };
      })
    );

    return tenantsWithStats;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db
      .insert(tenants)
      .values(tenant)
      .returning();
    return newTenant;
  }

  async updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [updatedTenant] = await db
      .update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updatedTenant;
  }

  async activateTenant(id: string, adminId: string): Promise<boolean> {
    const [result] = await db
      .update(tenants)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    
    if (result) {
      await this.logAdminAction({
        adminId,
        action: 'activate_tenant',
        targetType: 'tenant',
        targetId: id,
        details: { tenantName: result.name }
      });
    }
    
    return !!result;
  }

  async deactivateTenant(id: string, adminId: string): Promise<boolean> {
    const [result] = await db
      .update(tenants)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    
    if (result) {
      await this.logAdminAction({
        adminId,
        action: 'deactivate_tenant',
        targetType: 'tenant',
        targetId: id,
        details: { tenantName: result.name }
      });
    }
    
    return !!result;
  }

  async getAllUsers(filters?: { tenantId?: string; isActive?: boolean }): Promise<UserWithTenant[]> {
    let query = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        isActive: users.isActive,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        tenant: {
          id: tenants.id,
          name: tenants.name,
          domain: tenants.domain,
          isActive: tenants.isActive,
          plan: tenants.plan,
        }
      })
      .from(users)
      .leftJoin(tenants, eq(tenants.id, users.tenantId))
      .orderBy(desc(users.createdAt));

    if (filters?.tenantId) {
      query = query.where(eq(users.tenantId, filters.tenantId));
    }
    if (filters?.isActive !== undefined) {
      query = query.where(eq(users.isActive, filters.isActive));
    }

    const result = await query;
    return result.map(row => ({
      ...row,
      tenant: row.tenant.id ? row.tenant : undefined
    })) as UserWithTenant[];
  }

  async updateUserStatus(userId: string, isActive: boolean, adminId: string): Promise<boolean> {
    const [result] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (result) {
      await this.logAdminAction({
        adminId,
        action: isActive ? 'activate_user' : 'deactivate_user',
        targetType: 'user',
        targetId: userId,
        details: { email: result.email }
      });
    }
    
    return !!result;
  }

  async updateUserRole(userId: string, role: string, adminId: string): Promise<boolean> {
    const [result] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (result) {
      await this.logAdminAction({
        adminId,
        action: 'update_user_role',
        targetType: 'user',
        targetId: userId,
        details: { email: result.email, newRole: role }
      });
    }
    
    return !!result;
  }

  async logAdminAction(log: InsertAdminAuditLog): Promise<AdminAuditLog> {
    const [newLog] = await db
      .insert(adminAuditLog)
      .values(log)
      .returning();
    return newLog;
  }

  async getAdminAuditLogs(filters?: { adminId?: string; targetType?: string; limit?: number }): Promise<AdminAuditLog[]> {
    let query = db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt));

    if (filters?.adminId) {
      query = query.where(eq(adminAuditLog.adminId, filters.adminId));
    }
    if (filters?.targetType) {
      query = query.where(eq(adminAuditLog.targetType, filters.targetType));
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();