import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCollectionSchema, 
  insertDocumentSchema, 
  insertConversationSchema, 
  insertMessageSchema 
} from "@shared/schema";
import { generateIndependentResponse, generateCollectionResponse, generateConversationTitle } from "./services/openai";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept text files and PDFs
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Collections endpoints
  app.get("/api/collections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collections = await storage.getCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id, DEMO_USER_ID);
      
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const validatedData = insertCollectionSchema.parse({
        ...req.body,
        userId: DEMO_USER_ID,
      });
      
      const collection = await storage.createCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(400).json({ error: "Failed to create collection" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCollection(id, DEMO_USER_ID);
      
      if (!deleted) {
        return res.status(404).json({ error: "Collection not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Documents endpoints
  app.get("/api/collections/:id/documents", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getCollection(collectionId, DEMO_USER_ID);
      
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      const documents = await storage.getDocuments(collectionId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/collections/:id/documents", upload.single('file'), async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getCollection(collectionId, DEMO_USER_ID);
      
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const validatedData = insertDocumentSchema.parse({
        name: req.file.originalname,
        content: req.file.buffer.toString('utf-8'),
        mimeType: req.file.mimetype,
        size: req.file.size,
        collectionId,
      });
      
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(400).json({ error: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Conversations endpoints
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations(DEMO_USER_ID);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id, DEMO_USER_ID);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const { message, collectionId, type } = req.body;

      if (!message || !type) {
        return res.status(400).json({ error: "Message and type are required" });
      }

      // Generate conversation title
      const title = await generateConversationTitle(message);

      // Create conversation
      const validatedConversation = insertConversationSchema.parse({
        title,
        type,
        collectionId: collectionId || null,
        userId: DEMO_USER_ID,
      });
      
      const conversation = await storage.createConversation(validatedConversation);

      // Create user message
      const userMessage = await storage.createMessage({
        content: message,
        role: "user",
        conversationId: conversation.id,
        sources: null,
      });

      // Generate AI response
      let aiResponse;
      if (type === "collection" && collectionId) {
        const documents = await storage.getDocuments(collectionId);
        const collection = await storage.getCollection(collectionId, DEMO_USER_ID);
        aiResponse = await generateCollectionResponse(message, documents, collection?.name || "Collection");
      } else {
        aiResponse = await generateIndependentResponse(message);
      }

      // Create AI message
      const aiMessage = await storage.createMessage({
        content: aiResponse.content,
        role: "assistant",
        conversationId: conversation.id,
        sources: aiResponse.sources || null,
      });

      res.status(201).json({
        conversation,
        messages: [userMessage, aiMessage],
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Messages endpoints
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId, DEMO_USER_ID);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const conversation = await storage.getConversation(conversationId, DEMO_USER_ID);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        content,
        role: "user",
        conversationId,
        sources: null,
      });

      // Generate AI response
      let aiResponse;
      if (conversation.type === "collection" && conversation.collectionId) {
        const documents = await storage.getDocuments(conversation.collectionId);
        const collection = await storage.getCollection(conversation.collectionId, DEMO_USER_ID);
        aiResponse = await generateCollectionResponse(content, documents, collection?.name || "Collection");
      } else {
        aiResponse = await generateIndependentResponse(content);
      }

      // Create AI message
      const aiMessage = await storage.createMessage({
        content: aiResponse.content,
        role: "assistant",
        conversationId,
        sources: aiResponse.sources || null,
      });

      // Update conversation timestamp
      await storage.updateConversation(conversationId, {});

      res.status(201).json([userMessage, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
