import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User types table for Human and Assistant classifications
export const userTypes = pgTable("user_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // 'human', 'assistant'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User storage table for multi-provider auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"), // For email/password auth
  emailVerified: boolean("email_verified").default(false),
  role: varchar("role").default("user"), // 'user', 'admin', 'super_admin'
  isActive: boolean("is_active").default(true),
  tenantId: varchar("tenant_id"), // For multi-tenant support
  userTypeId: integer("user_type_id").default(1), // Foreign key to user_types, defaults to 'human'
  agentCategoryId: integer("agent_category_id"), // Foreign key to agent_categories, for assistants only
  about: text("about"), // Bio/description for assistants
  systemPrompt: text("system_prompt"), // AI persona prompt for assistants
  createdBy: varchar("created_by"), // User ID who created this assistant (null for humans)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenants table for multi-tenant SaaS management
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  domain: varchar("domain").unique(),
  isActive: boolean("is_active").default(true),
  plan: varchar("plan").default("free"), // 'free', 'pro', 'enterprise'
  maxUsers: integer("max_users").default(5),
  maxCollections: integer("max_collections").default(10),
  maxDocuments: integer("max_documents").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin audit log for tracking admin actions
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull(),
  action: varchar("action").notNull(), // 'activate_tenant', 'deactivate_tenant', 'delete_user', etc.
  targetType: varchar("target_type").notNull(), // 'tenant', 'user', 'system'
  targetId: varchar("target_id").notNull(),
  details: jsonb("details").default(null),
  createdAt: timestamp("created_at").defaultNow(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").notNull(),
  visibilityTypeId: integer("visibility_type_id").default(1), // Foreign key to visibility_types, defaults to Private
  isDefault: boolean("is_default").default(false), // For Personal Collection
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Ensure only one default (Personal) notebook per user
  index("idx_user_default_collection").on(table.userId, table.isDefault),
]);

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  type: varchar("type", { length: 20 }).default("upload"), // 'upload', 'bookmark'
  sourcePostId: integer("source_post_id"), // For bookmarked posts
  userId: varchar("user_id").notNull(), // Owner of the document
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Junction table for many-to-many relationship between collections and documents
export const collectionDocuments = pgTable("collection_documents", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  documentId: integer("document_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (table) => [
  index("idx_collection_documents_collection").on(table.collectionId),
  index("idx_collection_documents_document").on(table.documentId),
]);

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'independent' or 'collection'
  collectionId: integer("collection_id"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  conversationId: integer("conversation_id").notNull(),
  sources: jsonb("sources").default(null), // For collection-based responses with document references
  artifactData: jsonb("artifact_data").default(null), // For storing artifact metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// New artifacts table for dedicated artifact storage
export const artifacts = pgTable("artifacts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'code_playground', 'math_visualizer', 'document_generator', etc.
  content: text("content").notNull(), // The actual HTML/CSS/JS content
  metadata: jsonb("metadata").default(null), // Type-specific metadata
  userId: varchar("user_id").notNull(),
  messageId: integer("message_id"), // Optional link to original message
  collectionId: integer("collection_id"), // Optional link to collection
  version: integer("version").default(1),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent categories table for organizing AI assistants
export const agentCategories = pgTable("agent_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#3b82f6"), // Hex color for category
  createdAt: timestamp("created_at").defaultNow(),
});

// Visibility types table for collection privacy settings
export const visibilityTypes = pgTable("visibility_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // 'private', 'shared', 'public'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserTypeSchema = createInsertSchema(userTypes).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertCollectionDocumentSchema = createInsertSchema(collectionDocuments).omit({
  id: true,
  addedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentCategorySchema = createInsertSchema(agentCategories).omit({
  id: true,
  createdAt: true,
});

export const insertVisibilityTypeSchema = createInsertSchema(visibilityTypes).omit({
  id: true,
  createdAt: true,
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  createdAt: true,
});

// Types
export type UserType = typeof userTypes.$inferSelect;
export type InsertUserType = z.infer<typeof insertUserTypeSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type CollectionDocument = typeof collectionDocuments.$inferSelect;
export type InsertCollectionDocument = z.infer<typeof insertCollectionDocumentSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;

export type AgentCategory = typeof agentCategories.$inferSelect;
export type InsertAgentCategory = z.infer<typeof insertAgentCategorySchema>;

export type VisibilityType = typeof visibilityTypes.$inferSelect;
export type InsertVisibilityType = z.infer<typeof insertVisibilityTypeSchema>;

// Topics table for categorizing posts and content
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#6366f1"), // Hex color
  icon: varchar("icon", { length: 50 }), // Icon name
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Posts table for user-generated content
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  excerpt: text("excerpt"), // Auto-generated or manual excerpt
  authorId: varchar("author_id").notNull(),
  topicId: integer("topic_id").notNull(),
  communityId: integer("community_id"), // Optional association with community
  type: varchar("type", { length: 20 }).default("text"), // 'text', 'link', 'highlight', 'question'
  metadata: jsonb("metadata").default(null), // For links, highlights, etc.
  isPublished: boolean("is_published").default(true),
  isPinned: boolean("is_pinned").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Follows table for user connections
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull(),
  followingId: varchar("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_follows_follower").on(table.followerId),
  index("idx_follows_following").on(table.followingId),
]);

// Likes table for posts, comments, etc.
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(), // 'post', 'comment'
  targetId: integer("target_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_likes_user").on(table.userId),
  index("idx_likes_target").on(table.targetType, table.targetId),
]);

// Comments table for post discussions
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  postId: integer("post_id").notNull(),
  parentId: integer("parent_id"), // For nested comments
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_comments_post").on(table.postId),
  index("idx_comments_author").on(table.authorId),
]);

// Bookmarks table for saved posts
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  postId: integer("post_id").notNull(),
  collectionId: integer("collection_id").notNull(), // Required: which notebook this bookmark is saved to
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_bookmarks_user").on(table.userId),
  index("idx_bookmarks_post").on(table.postId),
]);

// Reposts table for sharing/reposting content
export const reposts = pgTable("reposts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  postId: integer("post_id").notNull(),
  comment: text("comment"), // Optional comment when reposting
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reposts_user").on(table.userId),
  index("idx_reposts_post").on(table.postId),
]);

// User topic interests for personalization
export const userTopicInterests = pgTable("user_topic_interests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  topicId: integer("topic_id").notNull(),
  interestLevel: integer("interest_level").default(1), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_topics").on(table.userId, table.topicId),
]);

// Insert schemas for new tables
export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertRepostSchema = createInsertSchema(reposts).omit({
  id: true,
  createdAt: true,
});

export const insertUserTopicInterestSchema = createInsertSchema(userTopicInterests).omit({
  id: true,
  createdAt: true,
});


// Types for new tables
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type Repost = typeof reposts.$inferSelect;
export type InsertRepost = z.infer<typeof insertRepostSchema>;

export type UserTopicInterest = typeof userTopicInterests.$inferSelect;
export type InsertUserTopicInterest = z.infer<typeof insertUserTopicInterestSchema>;


// Tags table for organizing content
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color code
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Communities table for user-created discussion groups
export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  bannerImage: varchar("banner_image"),
  visibility: varchar("visibility", { length: 20 }).default("public"), // 'public', 'private', 'invite_only'
  createdBy: varchar("created_by").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_communities_creator").on(table.createdBy),
  index("idx_communities_active").on(table.isActive),
]);

// Community tags junction table
export const communityTags = pgTable("community_tags", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull(),
  tagId: integer("tag_id").notNull(),
}, (table) => [
  index("idx_community_tags_community").on(table.communityId),
  index("idx_community_tags_tag").on(table.tagId),
]);

// User communities junction table for membership
export const userCommunities = pgTable("user_communities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  communityId: integer("community_id").notNull(),
  joinDate: timestamp("join_date").defaultNow().notNull(),
}, (table) => [
  index("idx_user_communities_user").on(table.userId),
  index("idx_user_communities_community").on(table.communityId),
]);

// Tasks table for scheduled AI tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(), // AI prompt to execute
  schedule: varchar("schedule"), // Cron expression or schedule
  isActive: boolean("is_active").default(true),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tasks_user").on(table.userId),
  index("idx_tasks_next_run").on(table.nextRun),
]);

// Task runs table for tracking execution history
export const taskRuns = pgTable("task_runs", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'running', 'completed', 'failed'
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  output: text("output"), // AI response/result
  errorMessage: text("error_message"), // Error details if failed
  duration: integer("duration"), // Execution time in milliseconds
}, (table) => [
  index("idx_task_runs_task").on(table.taskId),
  index("idx_task_runs_status").on(table.status),
  index("idx_task_runs_start_time").on(table.startTime),
]);

// Insert schemas for tags, communities and tasks  
export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityTagSchema = createInsertSchema(communityTags).omit({
  id: true,
});

export const insertUserCommunitySchema = createInsertSchema(userCommunities).omit({
  id: true,
  joinDate: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRun: true,
});

export const insertTaskRunSchema = createInsertSchema(taskRuns).omit({
  id: true,
  startTime: true,
});

// Types for tags, communities and tasks
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;

export type CommunityTag = typeof communityTags.$inferSelect;
export type InsertCommunityTag = z.infer<typeof insertCommunityTagSchema>;

export type UserCommunity = typeof userCommunities.$inferSelect;
export type InsertUserCommunity = z.infer<typeof insertUserCommunitySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskRun = typeof taskRuns.$inferSelect;
export type InsertTaskRun = z.infer<typeof insertTaskRunSchema>;

// Extended types for API responses
export type CollectionWithStats = Collection & {
  documentCount: number;
  lastUsed?: string;
};

export type ConversationWithPreview = Conversation & {
  preview: string;
  messageCount: number;
  lastMessage?: string;
};

// Admin dashboard types
export type TenantWithStats = Tenant & {
  userCount: number;
  collectionCount: number;
  documentCount: number;
  conversationCount: number;
  lastActivity?: string;
};

export type UserWithTenant = User & {
  tenant?: Tenant;
  activityStats?: {
    collectionCount: number;
    conversationCount: number;
    lastActivity?: string;
  };
};

export type AdminDashboardStats = {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalCollections: number;
  totalDocuments: number;
  totalConversations: number;
  newUsersThisMonth: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
    tenantId?: string;
  }>;
};

// Enhanced types for social features
export type PostWithDetails = Post & {
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  topic: Topic;
  collection?: Collection;
  stats: {
    likeCount: number;
    commentCount: number;
    repostCount: number;
    bookmarkCount: number;
  };
  userActions: {
    isLiked: boolean;
    isBookmarked: boolean;
    isReposted: boolean;
    isFollowing: boolean;
  };
};

export type CommentWithDetails = Comment & {
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  stats: {
    likeCount: number;
    replyCount: number;
  };
  userActions: {
    isLiked: boolean;
  };
  replies?: CommentWithDetails[];
};

export type UserProfile = User & {
  stats: {
    postCount: number;
    followerCount: number;
    followingCount: number;
    likeCount: number;
  };
  userActions: {
    isFollowing: boolean;
    isFollowedBy: boolean;
  };
  topInterests: Topic[];
};

export type FeedItem = {
  id: string;
  type: 'post' | 'repost' | 'like' | 'follow' | 'comment';
  post?: PostWithDetails;
  actor?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  action?: string;
  createdAt: string;
};

// Community types with stats
export type CommunityWithStats = Community & {
  memberCount: number;
  postCount: number;
  isJoined?: boolean;
  tags: Tag[];
  creator: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
};

// Subscription Plans table for Premium/Pro tiers
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // 'free', 'pro', 'premium'
  displayName: varchar("display_name", { length: 100 }).notNull(), // 'Free', 'Pro', 'Premium'
  description: text("description"),
  price: integer("price").notNull(), // Price in cents (e.g., 999 for $9.99)
  interval: varchar("interval", { length: 20 }).default("month"), // 'month', 'year'
  credits: integer("credits").notNull(), // Monthly credit allowance
  maxNotebooks: integer("max_notebooks").default(1),
  maxTasks: integer("max_tasks").default(1),
  maxAgents: integer("max_agents").default(1),
  maxCommunities: integer("max_communities").default(1),
  features: text("features").array(), // Array of feature descriptions
  isActive: boolean("is_active").default(true),
  stripePriceId: varchar("stripe_price_id"), // Stripe price ID for payments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Subscriptions table for tracking current plans
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  status: varchar("status", { length: 20 }).default("active"), // 'active', 'canceled', 'past_due', 'unpaid'
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_subscriptions_user").on(table.userId),
  index("idx_user_subscriptions_stripe").on(table.stripeSubscriptionId),
]);

// Credit Transactions table for tracking credit usage and purchases
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'subscription_grant', 'purchase', 'usage', 'gift_sent', 'gift_received'
  amount: integer("amount").notNull(), // Positive for credits added, negative for usage
  balance: integer("balance").notNull(), // User's balance after this transaction
  description: text("description").notNull(),
  metadata: jsonb("metadata").default(null), // Additional context (feature used, gift sender, etc.)
  referenceId: varchar("reference_id"), // Reference to subscription, purchase, or gift
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_credit_transactions_user").on(table.userId),
  index("idx_credit_transactions_type").on(table.type),
]);

// User Credits table for current balances
export const userCredits = pgTable("user_credits", {
  userId: varchar("user_id").primaryKey(),
  balance: integer("balance").default(0),
  monthlyAllowance: integer("monthly_allowance").default(0), // From subscription
  lastRefreshDate: timestamp("last_refresh_date").defaultNow(), // When monthly credits were last added
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_credits_balance").on(table.balance),
]);

// Credit Gifts table for peer-to-peer credit transfers
export const creditGifts = pgTable("credit_gifts", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  amount: integer("amount").notNull(),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
}, (table) => [
  index("idx_credit_gifts_to_user").on(table.toUserId),
  index("idx_credit_gifts_from_user").on(table.fromUserId),
]);

// Insert schemas for subscription tables
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserCreditsSchema = createInsertSchema(userCredits).omit({
  lastRefreshDate: true,
  updatedAt: true,
});

export const insertCreditGiftSchema = createInsertSchema(creditGifts).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
});

// Types for subscription tables
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;

export type CreditGift = typeof creditGifts.$inferSelect;
export type InsertCreditGift = z.infer<typeof insertCreditGiftSchema>;

// Enhanced types for subscription management
export type UserSubscriptionWithPlan = UserSubscription & {
  plan: SubscriptionPlan;
};

export type UserDashboardData = {
  subscription: UserSubscriptionWithPlan;
  credits: UserCredits;
  usage: {
    thisMonth: {
      aiPosts: number;
      agentInteractions: number;
      taskRuns: number;
      creditsUsed: number;
    };
    breakdown: Array<{
      feature: string;
      creditsUsed: number;
      percentage: number;
    }>;
  };
  recentTransactions: CreditTransaction[];
};
