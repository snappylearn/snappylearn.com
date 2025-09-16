import {
  users,
  collections,
  documents,
  collectionDocuments,
  conversations,
  conversationUsers,
  messages,
  artifacts,
  tenants,
  adminAuditLog,
  subscriptionPlans,
  userSubscriptions,
  creditTransactions,
  userCredits,
  creditGifts,
  posts,
  follows,
  communities,
  communityTags,
  userCommunities,
  tags,
  categories,
  type User,
  type UpsertUser,
  type InsertUser,
  type Collection,
  type InsertCollection,
  type Document,
  type InsertDocument,
  type Conversation,
  type InsertConversation,
  type ConversationUser,
  type InsertConversationUser,
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
  type SubscriptionPlan,
  type UserSubscription,
  type UserSubscriptionWithPlan,
  type CreditTransaction,
  type UserCredits,
  type CreditGift,
  type InsertUserSubscription,
  type InsertCreditTransaction,
  type InsertUserCredits,
  type InsertCreditGift,
  tags,
  communities,
  communityTags,
  userCommunities,
  tasks,
  taskRuns,
  type Tag,
  type Community,
  type InsertCommunity,
  type CommunityWithStats,
  type Category,
  type Task,
  type InsertTask,
  type TaskRun,
  type InsertTaskRun,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, ilike, inArray, gte, notInArray } from "drizzle-orm";

export interface IStorage {
  // User methods - required for multi-provider Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getPublicUsers(): Promise<User[]>;
  getSuggestedUsers(userId: string): Promise<User[]>;
  getUserProfile(targetUserId: string, currentUserId: string): Promise<any>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAgentsByUsernames(usernames: string[]): Promise<User[]>;
  getSnappyAgent(): Promise<User | undefined>;

  // Conversation User methods  
  addConversationParticipant(conversationId: number, userId: string, role?: string): Promise<ConversationUser>;
  getConversationParticipants(conversationId: number): Promise<User[]>;

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

  // Subscription methods
  getUserSubscription(userId: string): Promise<UserSubscriptionWithPlan | undefined>;
  createOrUpdateSubscription(userId: string, data: { planId: string; status: string; stripeCustomerId?: string; stripePaymentIntentId?: string; isYearly?: boolean }): Promise<UserSubscription>;
  getStripeCustomerId(userId: string): Promise<string | undefined>;
  updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>;
  
  // Credit methods
  getUserCredits(userId: string): Promise<UserCredits | undefined>;
  addCredits(userId: string, amount: number, type: string, description: string, referenceId?: string): Promise<void>;
  deductCredits(userId: string, amount: number, type: string, description: string, referenceId?: string): Promise<void>;
  giftCredits(fromUserId: string, toUserId: string, amount: number, message?: string): Promise<void>;
  getCreditTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>;
  getMonthlyUsage(userId: string): Promise<any>;

  // Task methods
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: number, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>, userId: string): Promise<Task | undefined>;
  deleteTask(id: number, userId: string): Promise<boolean>;
  getTaskRuns(taskId: number): Promise<TaskRun[]>;
  createTaskRun(taskRun: InsertTaskRun): Promise<TaskRun>;

  // Category methods
  getCategories(): Promise<Category[]>;
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

  async getSuggestedUsers(userId: string): Promise<User[]> {
    // Get IDs of users already followed by current user
    const followedUsers = await db
      .select({ userId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const followedUserIds = followedUsers.map(f => f.userId);

    // Get users excluding current user and already followed users, prioritizing AI assistants
    const suggestedUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        userTypeId: users.userTypeId,
        about: users.about,
        createdAt: users.createdAt,
        isActive: users.isActive,
        role: users.role
      })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        sql`${users.id} != ${userId}`,
        followedUserIds.length > 0 ? notInArray(users.id, followedUserIds) : sql`1=1`
      ))
      .orderBy(desc(users.userTypeId), desc(users.createdAt)) // AI users first (userTypeId = 2), then by creation date
      .limit(5);
    return suggestedUsers;
  }

  async getUserProfile(targetUserId: string, currentUserId: string): Promise<any> {
    // Get user basic info (excluding sensitive data like email)
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        userTypeId: users.userTypeId,
        about: users.about,
        createdAt: users.createdAt,
        isActive: users.isActive,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, targetUserId));

    if (!user) {
      return null;
    }

    // Get follower count
    const [followerCountResult] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, targetUserId));

    // Get post count (using the now-existing posts table)
    const [postCountResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.authorId, targetUserId));

    // Check if current user is following target user
    const [followStatus] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, currentUserId),
        eq(follows.followingId, targetUserId)
      ));

    return {
      ...user,
      followerCount: followerCountResult.count || 0,
      postCount: postCountResult.count || 0,
      isFollowing: !!followStatus,
      bio: user.about || null
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAgentsByUsernames(usernames: string[]): Promise<User[]> {
    if (usernames.length === 0) return [];
    
    const agents = await db
      .select()
      .from(users)
      .where(and(
        inArray(users.username, usernames),
        eq(users.userTypeId, 2) // Only AI assistants
      ));
    return agents;
  }

  async getSnappyAgent(): Promise<User | undefined> {
    const [snappyAgent] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'snappy'));
    return snappyAgent || undefined;
  }

  async addConversationParticipant(conversationId: number, userId: string, role: string = 'participant'): Promise<ConversationUser> {
    const [participant] = await db
      .insert(conversationUsers)
      .values({
        conversationId,
        userId,
        role,
      })
      .returning();
    return participant;
  }

  async getConversationParticipants(conversationId: number): Promise<User[]> {
    const participants = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        userTypeId: users.userTypeId,
        categoryId: users.categoryId,
        about: users.about,
        systemPrompt: users.systemPrompt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(conversationUsers)
      .innerJoin(users, eq(conversationUsers.userId, users.id))
      .where(eq(conversationUsers.conversationId, conversationId));
    
    return participants;
  }

  // Collection methods
  async getCollections(userId: string): Promise<CollectionWithStats[]> {
    const collectionsWithStats = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        userId: collections.userId,
        visibilityTypeId: collections.visibilityTypeId,
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
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
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

  // Subscription methods
  async getUserSubscription(userId: string): Promise<UserSubscriptionWithPlan | undefined> {
    const [result] = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans
      })
      .from(userSubscriptions)
      .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    if (!result) return undefined;

    return {
      ...result.subscription,
      plan: result.plan!
    };
  }

  async createOrUpdateSubscription(userId: string, data: { planId: string; status: string; stripeCustomerId?: string; stripePaymentIntentId?: string; isYearly?: boolean }): Promise<UserSubscription> {
    // Check if user already has a subscription
    const [existing] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    const subscriptionData = {
      userId,
      planId: parseInt(data.planId) || 1, // Default to free plan if invalid
      stripeCustomerId: data.stripeCustomerId,
      status: data.status,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + (data.isYearly ? 365 : 30) * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };

    if (existing) {
      // Update existing subscription
      const [updated] = await db
        .update(userSubscriptions)
        .set(subscriptionData)
        .where(eq(userSubscriptions.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new subscription
      const [created] = await db
        .insert(userSubscriptions)
        .values(subscriptionData)
        .returning();
      return created;
    }
  }

  async getStripeCustomerId(userId: string): Promise<string | undefined> {
    const [result] = await db
      .select({ stripeCustomerId: userSubscriptions.stripeCustomerId })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    
    return result?.stripeCustomerId || undefined;
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await db
      .update(userSubscriptions)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(userSubscriptions.userId, userId));
  }

  // Credit methods
  async getUserCredits(userId: string): Promise<UserCredits | undefined> {
    const [result] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId));
    
    return result || undefined;
  }

  async addCredits(userId: string, amount: number, type: string, description: string, referenceId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get current balance or create new record
      const [currentCredits] = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId));
      
      const currentBalance = currentCredits?.balance || 0;
      const newBalance = currentBalance + amount;

      // Update or create user credits
      if (currentCredits) {
        await tx
          .update(userCredits)
          .set({ balance: newBalance, updatedAt: new Date() })
          .where(eq(userCredits.userId, userId));
      } else {
        await tx
          .insert(userCredits)
          .values({ userId, balance: newBalance, monthlyAllowance: amount });
      }

      // Record transaction
      await tx
        .insert(creditTransactions)
        .values({
          userId,
          type,
          amount,
          balance: newBalance,
          description,
          referenceId
        });
    });
  }

  async deductCredits(userId: string, amount: number, type: string, description: string, referenceId?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get current balance
      const [currentCredits] = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId));
      
      if (!currentCredits || currentCredits.balance < amount) {
        throw new Error("Insufficient credits");
      }

      const newBalance = currentCredits.balance - amount;

      // Update user credits
      await tx
        .update(userCredits)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(userCredits.userId, userId));

      // Record transaction (negative amount)
      await tx
        .insert(creditTransactions)
        .values({
          userId,
          type,
          amount: -amount,
          balance: newBalance,
          description,
          referenceId
        });
    });
  }

  async giftCredits(fromUserId: string, toUserId: string, amount: number, message?: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Deduct from sender
      await this.deductCredits(fromUserId, amount, "gift_sent", `Gift to user ${toUserId}`);
      
      // Add to recipient
      await this.addCredits(toUserId, amount, "gift_received", `Gift from user ${fromUserId}: ${message || ''}`);
      
      // Record gift
      await tx
        .insert(creditGifts)
        .values({
          fromUserId,
          toUserId,
          amount,
          message,
          status: "accepted",
          acceptedAt: new Date()
        });
    });
  }

  async getCreditTransactions(userId: string, limit: number = 20): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit);
  }

  async getMonthlyUsage(userId: string): Promise<any> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.userId, userId),
          gte(creditTransactions.createdAt, startOfMonth)
        )
      );

    const usage = {
      thisMonth: {
        aiPosts: 0,
        agentInteractions: 0,
        taskRuns: 0,
        creditsUsed: 0
      },
      breakdown: [] as Array<{ feature: string; creditsUsed: number; percentage: number }>
    };

    const featureUsage: Record<string, number> = {};
    let totalUsed = 0;

    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only negative amounts (usage)
        const credits = Math.abs(tx.amount);
        totalUsed += credits;
        
        // Categorize usage based on description or type
        if (tx.description.includes('post')) {
          usage.thisMonth.aiPosts += credits;
          featureUsage['AI Posts'] = (featureUsage['AI Posts'] || 0) + credits;
        } else if (tx.description.includes('agent')) {
          usage.thisMonth.agentInteractions += credits;
          featureUsage['Agent Interactions'] = (featureUsage['Agent Interactions'] || 0) + credits;
        } else if (tx.description.includes('task')) {
          usage.thisMonth.taskRuns += credits;
          featureUsage['Task Runs'] = (featureUsage['Task Runs'] || 0) + credits;
        } else {
          featureUsage['Other'] = (featureUsage['Other'] || 0) + credits;
        }
      }
    });

    usage.thisMonth.creditsUsed = totalUsed;

    // Calculate breakdown percentages
    usage.breakdown = Object.entries(featureUsage).map(([feature, creditsUsed]) => ({
      feature,
      creditsUsed,
      percentage: totalUsed > 0 ? Math.round((creditsUsed / totalUsed) * 100) : 0
    }));

    return usage;
  }

  // Tags methods
  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.isActive, true)).orderBy(tags.name);
  }

  async searchTags(query: string): Promise<Tag[]> {
    return await db.select().from(tags)
      .where(and(
        eq(tags.isActive, true),
        ilike(tags.name, `%${query}%`)
      ))
      .orderBy(tags.name);
  }

  // Categories methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  // Communities methods
  async getCommunitiesWithStats(userId?: string): Promise<CommunityWithStats[]> {
    const query = db
      .select({
        community: communities,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        memberCount: sql<number>`COALESCE(COUNT(DISTINCT ${userCommunities.id}), 0)`,
        postCount: sql<number>`COALESCE(COUNT(DISTINCT ${posts.id}), 0)`,
      })
      .from(communities)
      .leftJoin(users, eq(communities.createdBy, users.id))
      .leftJoin(userCommunities, eq(communities.id, userCommunities.communityId))
      .leftJoin(posts, and(eq(posts.communityId, communities.id), eq(posts.isPublished, true)))
      .where(eq(communities.isActive, true))
      .groupBy(communities.id, users.id);

    const results = await query;
    
    // Get tags for each community
    const communityIds = results.map(r => r.community.id);
    const communityTagsData = await db
      .select({
        communityId: communityTags.communityId,
        tag: tags,
      })
      .from(communityTags)
      .innerJoin(tags, eq(communityTags.tagId, tags.id))
      .where(inArray(communityTags.communityId, communityIds));

    // Get user memberships if userId provided
    let userMemberships: { communityId: number }[] = [];
    if (userId) {
      userMemberships = await db
        .select({ communityId: userCommunities.communityId })
        .from(userCommunities)
        .where(eq(userCommunities.userId, userId));
    }

    return results.map(result => ({
      ...result.community,
      creator: result.creator,
      memberCount: result.memberCount,
      postCount: result.postCount,
      tags: communityTagsData
        .filter(ct => ct.communityId === result.community.id)
        .map(ct => ct.tag),
      isJoined: userMemberships.some(um => um.communityId === result.community.id),
    }));
  }

  async createCommunity(data: InsertCommunity & { tagIds: number[] }, userId: string): Promise<Community> {
    return await db.transaction(async (tx) => {
      // Create community
      const [community] = await tx
        .insert(communities)
        .values({ ...data, createdBy: userId })
        .returning();

      // Add tags
      if (data.tagIds.length > 0) {
        await tx.insert(communityTags).values(
          data.tagIds.map(tagId => ({
            communityId: community.id,
            tagId,
          }))
        );
      }

      // Add creator as member
      await tx.insert(userCommunities).values({
        userId,
        communityId: community.id,
      });

      return community;
    });
  }

  async joinCommunity(userId: string, communityId: number): Promise<void> {
    // Check if the user is the creator of the community
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId));
    
    if (!community) {
      throw new Error("Community not found");
    }
    
    if (community.createdBy === userId) {
      throw new Error("You cannot join your own community - you are already the owner");
    }
    
    await db.insert(userCommunities).values({
      userId,
      communityId,
    }).onConflictDoNothing();
  }

  async leaveCommunity(userId: string, communityId: number): Promise<void> {
    await db.delete(userCommunities).where(
      and(
        eq(userCommunities.userId, userId),
        eq(userCommunities.communityId, communityId)
      )
    );
  }

  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return result.rowCount > 0;
  }

  async getTaskRuns(taskId: number): Promise<TaskRun[]> {
    return await db
      .select()
      .from(taskRuns)
      .where(eq(taskRuns.taskId, taskId))
      .orderBy(desc(taskRuns.startTime));
  }

  async createTaskRun(taskRun: InsertTaskRun): Promise<TaskRun> {
    const [newTaskRun] = await db
      .insert(taskRuns)
      .values(taskRun)
      .returning();
    return newTaskRun;
  }
}

export const storage = new DatabaseStorage();