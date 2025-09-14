import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSupabaseAuth } from "./supabaseAuth";
import { setupAuthRoutes, jwtAuth, getJwtUserId } from "./routes/auth";
import { setupGoogleAuth } from "./routes/googleAuth";
import { registerAdminRoutes } from "./routes/admin";
import { 
  insertCollectionSchema, 
  insertDocumentSchema, 
  insertConversationSchema, 
  insertMessageSchema,
  insertCommunitySchema
} from "@shared/schema";
import { z } from "zod";
import { generateIndependentResponse, generateCollectionResponse, generateConversationTitle } from "./services/openai";
import { registerPostRoutes } from "./routes/posts";
import { registerTopicRoutes } from "./routes/topics";
import { registerFollowRoutes } from "./routes/follows";
import { registerTaskRoutes } from "./routes/tasks";
import { seedDatabase } from "./seed";
import { registerSubscriptionRoutes } from "./routes/subscription";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF and TXT files
    const allowedTypes = [
      'text/plain',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Supabase authentication
  await setupSupabaseAuth(app);
  
  // Setup custom auth routes
  setupAuthRoutes(app);
  
  // Setup Google OAuth routes
  setupGoogleAuth(app);

  // Setup admin routes
  registerAdminRoutes(app);

  // Setup social platform routes
  registerPostRoutes(app);
  registerTopicRoutes(app);
  registerFollowRoutes(app);
  registerTaskRoutes(app);
  
  // Setup subscription routes
  registerSubscriptionRoutes(app);

  // Seed database with demo data
  await seedDatabase();

  // Test route to make current user admin (for development)
  app.post("/api/test/make-admin", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      await storage.updateUserRole(userId, 'admin', 'system');
      res.json({ message: "User is now admin" });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ error: "Failed to make user admin" });
    }
  });

  // Auth routes are handled by setupSupabaseAuth

  // Public users endpoint for discover page
  app.get("/api/users", jwtAuth, async (req: any, res) => {
    try {
      // Get all users with their user type info for discover page
      const users = await storage.getPublicUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Suggested users endpoint for recommendations
  app.get("/api/users/suggested", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const suggestedUsers = await storage.getSuggestedUsers(userId);
      res.json(suggestedUsers);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ error: "Failed to fetch suggested users" });
    }
  });

  // Individual user profile endpoint
  app.get("/api/users/:id", jwtAuth, async (req: any, res) => {
    try {
      const currentUserId = getJwtUserId(req);
      const targetUserId = req.params.id;
      const userProfile = await storage.getUserProfile(targetUserId, currentUserId);
      
      if (!userProfile) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Collections endpoints
  app.get("/api/collections", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      let collections = await storage.getCollections(userId);
      
      // Ensure user has a Personal Collection (default collection)
      const hasPersonalCollection = collections.some((c: any) => c.isDefault);
      if (!hasPersonalCollection) {
        try {
          await storage.createCollection({
            name: "Personal Collection",
            description: "Your default collection for saved posts and documents",
            userId: userId,
            visibilityTypeId: 1, // Private
            isDefault: true,
          });
          // Refetch collections to include the newly created Personal Collection
          collections = await storage.getCollections(userId);
        } catch (collectionError) {
          console.error("Failed to create Personal Collection:", collectionError);
          // Don't fail the request if collection creation fails
        }
      }
      
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ error: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      const collection = await storage.getCollection(id, userId);
      
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }

      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ error: "Failed to fetch collection" });
    }
  });

  app.post("/api/collections", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const validatedData = insertCollectionSchema.parse({
        ...req.body,
        userId,
      });
      
      const collection = await storage.createCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  app.put("/api/collections/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCollectionSchema.partial().parse(req.body);
      
      const collection = await storage.updateCollection(id, updates);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ error: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      const success = await storage.deleteCollection(id, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ error: "Failed to delete collection" });
    }
  });

  // Document endpoints
  app.get("/api/collections/:id/documents", jwtAuth, async (req: any, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      
      // Verify user owns the collection
      const collection = await storage.getCollection(collectionId, userId);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      const documents = await storage.getDocuments(collectionId, userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/collections/:id/documents", jwtAuth, upload.single('file'), async (req: any, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      
      // Verify user owns the collection
      const collection = await storage.getCollection(collectionId, userId);
      if (!collection) {
        return res.status(404).json({ error: "Collection not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let content = '';
      
      // Extract text based on file type
      if (req.file.mimetype === 'application/pdf') {
        try {
          const pdf = await import('pdf-parse');
          const pdfData = await pdf.default(req.file.buffer);
          content = pdfData.text;
        } catch (error) {
          console.error("Error extracting PDF text:", error);
          return res.status(400).json({ error: "Failed to extract text from PDF" });
        }
      } else if (req.file.mimetype === 'text/plain') {
        content = req.file.buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      const validatedData = insertDocumentSchema.parse({
        name: req.file.originalname,
        content,
        mimeType: req.file.mimetype,
        size: req.file.size,
        collectionId,
      });

      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      
      const success = await storage.deleteDocument(id, userId);
      if (!success) {
        return res.status(404).json({ error: "Document not found or access denied" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Conversations endpoints
  app.get("/api/conversations", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      const conversation = await storage.getConversation(id, userId);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Update multer configuration to support more file types
  const conversationUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Unsupported file type'));
      }
    },
  });

  app.post("/api/conversations", jwtAuth, conversationUpload.array('attachments'), async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { message, type, collectionId } = req.body;
      const files = req.files as Express.Multer.File[] || [];

      // Parse collectionId if it's a string from FormData
      const parsedCollectionId = collectionId ? parseInt(collectionId) : undefined;

      // Validate collection ownership if provided
      if (parsedCollectionId) {
        const collection = await storage.getCollection(parsedCollectionId, userId);
        if (!collection) {
          return res.status(404).json({ error: "Collection not found" });
        }
      }

      // Process attached files if any
      let attachmentContent = "";
      if (files.length > 0) {
        const attachmentParts: string[] = [];
        
        for (const file of files) {
          let content = "";
          
          // Extract text based on file type
          if (file.mimetype === 'application/pdf') {
            try {
              const pdf = await import('pdf-parse');
              const pdfData = await pdf.default(file.buffer);
              content = pdfData.text;
            } catch (error) {
              console.error("Error extracting PDF text:", error);
              return res.status(400).json({ error: `Failed to extract text from ${file.originalname}` });
            }
          } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown' || file.mimetype === 'text/csv') {
            content = file.buffer.toString('utf-8');
          } else {
            return res.status(400).json({ error: `Unsupported file type: ${file.originalname}` });
          }
          
          attachmentParts.push(`--- Content from ${file.originalname} ---\n${content}\n`);
        }
        
        attachmentContent = attachmentParts.join('\n');
      }

      // Combine message with attachment content
      const fullMessage = attachmentContent 
        ? `${message}\n\n${attachmentContent}` 
        : message;

      // Generate conversation title from first message
      const title = await generateConversationTitle(message);

      const conversationData = insertConversationSchema.parse({
        title,
        type,
        collectionId: parsedCollectionId,
        userId,
      });

      const conversation = await storage.createConversation(conversationData);

      // Create user message
      const userMessage = await storage.createMessage({
        content: fullMessage,
        role: "user",
        conversationId: conversation.id,
      });

      // Return conversation immediately - no AI response yet
      res.status(201).json({
        conversation,
        messages: [userMessage],
      });

      // Generate AI response asynchronously (don't await)
      (async () => {
        try {
          // Generate AI response
          let aiResponse;
          if (type === "collection" && parsedCollectionId) {
            const documents = await storage.getDocuments(parsedCollectionId, userId);
            const collection = await storage.getCollection(parsedCollectionId, userId);
            const collectionName = collection?.name || "Collection";
            aiResponse = await generateCollectionResponse(fullMessage, documents, collectionName);
          } else {
            const content = await generateIndependentResponse(fullMessage);
            aiResponse = { content, sources: null };
          }

          // Ensure aiResponse has content
          if (!aiResponse || !aiResponse.content) {
            aiResponse = { content: "I'm sorry, I couldn't generate a response. Please try again.", sources: null };
          }

          // Check if response contains artifact
          const artifactMatch = aiResponse.content.match(/\[ARTIFACT_START\]([\s\S]*?)\[ARTIFACT_END\]/);
          let artifactData = null;
          
          if (artifactMatch) {
            const artifactHtml = artifactMatch[1];
            const titleMatch = artifactHtml.match(/<!-- Artifact Title: (.*?) -->/);
            const title = titleMatch ? titleMatch[1] : 'Interactive Content';
            
            // Determine artifact type based on content
            let artifactType = 'interactive';
            if (title.toLowerCase().includes('quiz')) artifactType = 'quiz_builder';
            else if (title.toLowerCase().includes('calculator')) artifactType = 'math_visualizer';
            else if (title.toLowerCase().includes('playground')) artifactType = 'code_playground';
            else if (title.toLowerCase().includes('document')) artifactType = 'document_generator';
            else if (title.toLowerCase().includes('presentation')) artifactType = 'presentation_maker';
            else if (title.toLowerCase().includes('chart') || title.toLowerCase().includes('graph')) artifactType = 'data_visualizer';
            else if (title.toLowerCase().includes('mind map')) artifactType = 'mind_map_creator';
            
            // Create artifact record
            const artifact = await storage.createArtifact({
              title,
              type: artifactType,
              content: artifactHtml,
              userId,
              collectionId: parsedCollectionId,
              metadata: JSON.stringify({ 
                createdFrom: 'chat',
                conversationId: conversation.id
              })
            });
            
            artifactData = {
              artifactId: artifact.id,
              title,
              type: artifactType
            };
          }

          // Create AI message
          await storage.createMessage({
            content: aiResponse.content,
            role: "assistant",
            conversationId: conversation.id,
            sources: aiResponse.sources ? JSON.stringify(aiResponse.sources) : null,
            artifactData: artifactData ? JSON.stringify(artifactData) : null,
          });

        } catch (error) {
          console.error("Error generating AI response:", error);
          // Create error message if AI response fails
          await storage.createMessage({
            content: "I'm sorry, I encountered an error while generating a response. Please try asking your question again.",
            role: "assistant",
            conversationId: conversation.id,
          });
        }
      })();

    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      const success = await storage.deleteConversation(id, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Messages endpoints
  app.get("/api/conversations/:id/messages", jwtAuth, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      
      // Verify user owns the conversation
      const conversation = await storage.getConversation(conversationId, userId);
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

  app.post("/api/conversations/:id/messages", jwtAuth, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      const { content } = req.body;

      // Verify user owns the conversation
      const conversation = await storage.getConversation(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Create user message
      const userMessage = await storage.createMessage({
        content,
        role: "user",
        conversationId,
      });

      // Get conversation history for context
      const existingMessages = await storage.getMessages(conversationId);
      const conversationHistory = existingMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Generate AI response
      let aiResponse;
      if (conversation.type === "collection" && conversation.collectionId) {
        const documents = await storage.getDocuments(conversation.collectionId, userId);
        const collection = await storage.getCollection(conversation.collectionId, userId);
        const collectionName = collection?.name || "Collection";
        aiResponse = await generateCollectionResponse(content, documents, collectionName, conversationHistory);
      } else {
        const responseContent = await generateIndependentResponse(content);
        aiResponse = { content: responseContent, sources: null };
      }

      // Ensure aiResponse has content
      if (!aiResponse || !aiResponse.content) {
        aiResponse = { content: "I'm sorry, I couldn't generate a response. Please try again.", sources: null };
      }

      // Check if response contains artifact
      const artifactMatch = aiResponse.content.match(/\[ARTIFACT_START\]([\s\S]*?)\[ARTIFACT_END\]/);
      let artifactData = null;
      let artifactId = null;
      
      if (artifactMatch) {
        const artifactHtml = artifactMatch[1];
        const titleMatch = artifactHtml.match(/<!-- Artifact Title: (.*?) -->/);
        const title = titleMatch ? titleMatch[1] : 'Interactive Content';
        
        // Determine artifact type based on content
        let artifactType = 'interactive';
        if (title.toLowerCase().includes('quiz')) artifactType = 'quiz_builder';
        else if (title.toLowerCase().includes('calculator')) artifactType = 'math_visualizer';
        else if (title.toLowerCase().includes('playground')) artifactType = 'code_playground';
        else if (title.toLowerCase().includes('document')) artifactType = 'document_generator';
        else if (title.toLowerCase().includes('presentation')) artifactType = 'presentation_maker';
        else if (title.toLowerCase().includes('chart') || title.toLowerCase().includes('graph')) artifactType = 'data_visualizer';
        else if (title.toLowerCase().includes('mind map')) artifactType = 'mind_map_creator';
        
        // Create artifact record
        const artifact = await storage.createArtifact({
          title,
          type: artifactType,
          content: artifactHtml,
          userId,
          collectionId: conversation.collectionId,
          metadata: JSON.stringify({ 
            createdFrom: 'chat',
            conversationId: conversationId
          })
        });
        
        artifactId = artifact.id;
        artifactData = {
          artifactId: artifact.id,
          title,
          type: artifactType
        };
      }

      // Create AI message
      const aiMessage = await storage.createMessage({
        content: aiResponse.content,
        role: "assistant",
        conversationId,
        sources: aiResponse.sources ? JSON.stringify(aiResponse.sources) : null,
        artifactData: artifactData ? JSON.stringify(artifactData) : null,
      });

      res.status(201).json([userMessage, aiMessage]);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Artifact endpoints
  app.get("/api/artifacts", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { type, collectionId } = req.query;
      
      const filters: any = {};
      if (type) filters.type = type;
      if (collectionId) filters.collectionId = parseInt(collectionId);
      
      const artifacts = await storage.getArtifacts(userId, filters);
      res.json(artifacts);
    } catch (error) {
      console.error("Error fetching artifacts:", error);
      res.status(500).json({ error: "Failed to fetch artifacts" });
    }
  });

  app.get("/api/artifacts/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      
      const artifact = await storage.getArtifact(id, userId);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      
      res.json(artifact);
    } catch (error) {
      console.error("Error fetching artifact:", error);
      res.status(500).json({ error: "Failed to fetch artifact" });
    }
  });

  app.post("/api/artifacts", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { title, type, content, description, collectionId, metadata } = req.body;
      
      // Validate collection ownership if provided
      if (collectionId) {
        const collection = await storage.getCollection(collectionId, userId);
        if (!collection) {
          return res.status(404).json({ error: "Collection not found" });
        }
      }
      
      const artifact = await storage.createArtifact({
        title,
        type,
        content,
        description,
        collectionId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        userId,
      });
      
      res.status(201).json(artifact);
    } catch (error) {
      console.error("Error creating artifact:", error);
      res.status(500).json({ error: "Failed to create artifact" });
    }
  });

  app.put("/api/artifacts/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      const { title, type, content, description, collectionId, metadata } = req.body;
      
      // Verify user owns the artifact
      const existingArtifact = await storage.getArtifact(id, userId);
      if (!existingArtifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      
      // Validate collection ownership if provided
      if (collectionId) {
        const collection = await storage.getCollection(collectionId, userId);
        if (!collection) {
          return res.status(404).json({ error: "Collection not found" });
        }
      }
      
      const artifact = await storage.updateArtifact(id, {
        title,
        type,
        content,
        description,
        collectionId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
      
      res.json(artifact);
    } catch (error) {
      console.error("Error updating artifact:", error);
      res.status(500).json({ error: "Failed to update artifact" });
    }
  });

  app.delete("/api/artifacts/:id", jwtAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getJwtUserId(req);
      
      const success = await storage.deleteArtifact(id, userId);
      if (!success) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting artifact:", error);
      res.status(500).json({ error: "Failed to delete artifact" });
    }
  });

  // User profile endpoints
  app.patch("/api/users/profile", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const { firstName, lastName, email } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.patch("/api/users/settings", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const settings = req.body;
      
      // For now, we'll just return success since we don't have a settings table
      // In a real app, you'd store these in a user_settings table
      res.json({ success: true, settings });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/users/export", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      
      // Get all user data
      const user = await storage.getUser(userId);
      const collections = await storage.getCollections(userId);
      const conversations = await storage.getConversations(userId);
      const artifacts = await storage.getArtifacts(userId);
      
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          role: user?.role,
          createdAt: user?.createdAt,
        },
        collections,
        conversations,
        artifacts,
        exportedAt: new Date().toISOString(),
      };
      
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.delete("/api/users/account", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      
      // Delete user and all related data
      // Note: In production, you might want to soft delete or archive data
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Tags endpoints
  app.get("/api/tags", async (req, res) => {
    try {
      const query = req.query.search as string;
      const tags = query 
        ? await storage.searchTags(query)
        : await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Communities endpoints
  app.get("/api/communities", async (req: any, res) => {
    try {
      // Get userId from JWT if authenticated
      let userId: string | undefined;
      try {
        userId = getJwtUserId(req);
      } catch (error) {
        // User not authenticated, continue without userId
      }
      
      const communities = await storage.getCommunitiesWithStats(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  app.post("/api/communities", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      
      const validatedData = insertCommunitySchema.extend({
        tagIds: z.array(z.number()),
      }).parse(req.body);

      const community = await storage.createCommunity(validatedData, userId);
      res.status(201).json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create community" });
      }
    }
  });

  app.post("/api/communities/:id/join", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const communityId = parseInt(req.params.id);
      
      await storage.joinCommunity(userId, communityId);
      res.json({ message: "Successfully joined community" });
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  app.delete("/api/communities/:id/leave", jwtAuth, async (req: any, res) => {
    try {
      const userId = getJwtUserId(req);
      const communityId = parseInt(req.params.id);
      
      await storage.leaveCommunity(userId, communityId);
      res.json({ message: "Successfully left community" });
    } catch (error) {
      console.error("Error leaving community:", error);
      res.status(500).json({ message: "Failed to leave community" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}