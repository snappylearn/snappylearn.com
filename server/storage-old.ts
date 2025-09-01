import {
  users,
  collections,
  documents,
  conversations,
  messages,
  type User,
  type InsertUser,
  type UpsertUser,
  type Collection,
  type InsertCollection,
  type Document,
  type InsertDocument,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type CollectionWithStats,
  type ConversationWithPreview,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User methods - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Collection methods
  getCollections(userId: string): Promise<CollectionWithStats[]>;
  getCollection(id: number, userId: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, updates: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number, userId: string): Promise<boolean>;

  // Document methods
  getDocuments(collectionId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;

  // Conversation methods
  getConversations(userId: string): Promise<ConversationWithPreview[]>;
  getConversation(id: number, userId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number, userId: string): Promise<boolean>;

  // Message methods
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collections: Map<number, Collection>;
  private documents: Map<number, Document>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private currentId: { users: number; collections: number; documents: number; conversations: number; messages: number };

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.documents = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.currentId = {
      users: 1,
      collections: 1,
      documents: 1,
      conversations: 1,
      messages: 1,
    };

    // Create a default user for demo purposes
    this.createUser({ username: "demo", password: "demo" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Collection methods
  async getCollections(userId: number): Promise<CollectionWithStats[]> {
    const userCollections = Array.from(this.collections.values()).filter(
      (collection) => collection.userId === userId
    );

    return userCollections.map((collection) => {
      const documentCount = Array.from(this.documents.values()).filter(
        (doc) => doc.collectionId === collection.id
      ).length;

      const collectionConversations = Array.from(this.conversations.values()).filter(
        (conv) => conv.collectionId === collection.id
      );

      const lastUsed = collectionConversations.length > 0
        ? collectionConversations
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
            .updatedAt.toISOString()
        : undefined;

      return {
        ...collection,
        documentCount,
        lastUsed,
      };
    });
  }

  async getCollection(id: number, userId: number): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    return collection && collection.userId === userId ? collection : undefined;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.currentId.collections++;
    const now = new Date();
    const collection: Collection = {
      id,
      name: insertCollection.name,
      description: insertCollection.description ?? null,
      userId: insertCollection.userId,
      createdAt: now,
      updatedAt: now,
    };
    this.collections.set(id, collection);
    return collection;
  }

  async updateCollection(id: number, updates: Partial<InsertCollection>): Promise<Collection | undefined> {
    const existing = this.collections.get(id);
    if (!existing) return undefined;

    const updated: Collection = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: number, userId: number): Promise<boolean> {
    const collection = this.collections.get(id);
    if (!collection || collection.userId !== userId) return false;

    this.collections.delete(id);
    // Also delete associated documents and conversations
    Array.from(this.documents.entries()).forEach(([docId, doc]) => {
      if (doc.collectionId === id) {
        this.documents.delete(docId);
      }
    });
    Array.from(this.conversations.entries()).forEach(([convId, conv]) => {
      if (conv.collectionId === id) {
        this.conversations.delete(convId);
      }
    });
    return true;
  }

  // Document methods
  async getDocuments(collectionId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.collectionId === collectionId
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId.documents++;
    const document: Document = {
      ...insertDocument,
      id,
      uploadedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Conversation methods
  async getConversations(userId: number): Promise<ConversationWithPreview[]> {
    const userConversations = Array.from(this.conversations.values()).filter(
      (conversation) => conversation.userId === userId
    );

    return userConversations.map((conversation) => {
      const conversationMessages = Array.from(this.messages.values()).filter(
        (message) => message.conversationId === conversation.id
      );

      const lastMessage = conversationMessages.length > 0
        ? conversationMessages.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        : undefined;

      return {
        ...conversation,
        preview: lastMessage?.content.substring(0, 100) || "No messages yet",
        messageCount: conversationMessages.length,
        lastMessage: lastMessage?.createdAt.toISOString(),
      };
    }).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getConversation(id: number, userId: number): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    return conversation && conversation.userId === userId ? conversation : undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentId.conversations++;
    const now = new Date();
    const conversation: Conversation = {
      id,
      title: insertConversation.title,
      type: insertConversation.type,
      collectionId: insertConversation.collectionId ?? null,
      userId: insertConversation.userId,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const existing = this.conversations.get(id);
    if (!existing) return undefined;

    const updated: Conversation = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: number, userId: number): Promise<boolean> {
    const conversation = this.conversations.get(id);
    if (!conversation || conversation.userId !== userId) return false;

    this.conversations.delete(id);
    // Also delete associated messages
    Array.from(this.messages.entries()).forEach(([msgId, msg]) => {
      if (msg.conversationId === id) {
        this.messages.delete(msgId);
      }
    });
    return true;
  }

  // Message methods
  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId.messages++;
    const message: Message = {
      id,
      content: insertMessage.content,
      role: insertMessage.role,
      conversationId: insertMessage.conversationId,
      sources: insertMessage.sources || null,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getCollections(userId: number): Promise<CollectionWithStats[]> {
    const collectionsWithStats = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        userId: collections.userId,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        documentCount: count(documents.id),
      })
      .from(collections)
      .leftJoin(documents, eq(collections.id, documents.collectionId))
      .where(eq(collections.userId, userId))
      .groupBy(collections.id)
      .orderBy(desc(collections.updatedAt));

    return collectionsWithStats.map(collection => ({
      ...collection,
      documentCount: Number(collection.documentCount),
    }));
  }

  async getCollection(id: number, userId: number): Promise<Collection | undefined> {
    const [collection] = await db
      .select()
      .from(collections)
      .where(sql`${collections.id} = ${id} AND ${collections.userId} = ${userId}`);
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

  async deleteCollection(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(collections)
      .where(sql`${collections.id} = ${id} AND ${collections.userId} = ${userId}`);
    return (result.rowCount ?? 0) > 0;
  }

  async getDocuments(collectionId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.collectionId, collectionId))
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

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getConversations(userId: number): Promise<ConversationWithPreview[]> {
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
        lastMessage: sql<string>`MAX(${messages.createdAt})`,
      })
      .from(conversations)
      .leftJoin(messages, eq(conversations.id, messages.conversationId))
      .where(eq(conversations.userId, userId))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.updatedAt));

    return await Promise.all(
      conversationsWithPreview.map(async (conv) => {
        const [lastMessage] = await db
          .select({ content: messages.content })
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          ...conv,
          messageCount: Number(conv.messageCount),
          preview: lastMessage?.content?.substring(0, 100) || "No messages yet",
          lastMessage: conv.lastMessage,
        };
      })
    );
  }

  async getConversation(id: number, userId: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(sql`${conversations.id} = ${id} AND ${conversations.userId} = ${userId}`);
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

  async deleteConversation(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(conversations)
      .where(sql`${conversations.id} = ${id} AND ${conversations.userId} = ${userId}`);
    return (result.rowCount ?? 0) > 0;
  }

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
}

export const storage = new DatabaseStorage();
