import { apiRequest } from "./queryClient";
import type { 
  Collection, 
  Document, 
  Conversation, 
  Message, 
  InsertCollection, 
  CollectionWithStats,
  ConversationWithPreview 
} from "@shared/schema";

// Collections API
export const collectionsApi = {
  getAll: async (): Promise<CollectionWithStats[]> => {
    const res = await apiRequest("/api/collections", "GET");
    return res.json();
  },

  getById: async (id: number): Promise<Collection> => {
    const res = await apiRequest(`/api/collections/${id}`, "GET");
    return res.json();
  },

  create: async (data: Omit<InsertCollection, "userId">): Promise<Collection> => {
    const res = await apiRequest("/api/collections", "POST", data);
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest(`/api/collections/${id}`, "DELETE");
  },
};

// Documents API
export const documentsApi = {
  getByCollection: async (collectionId: number): Promise<Document[]> => {
    const res = await apiRequest(`/api/collections/${collectionId}/documents`, "GET");
    return res.json();
  },

  upload: async (collectionId: number, file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const res = await fetch(`/api/collections/${collectionId}/documents`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest(`/api/documents/${id}`, "DELETE");
  },
};

// Conversations API
export const conversationsApi = {
  getAll: async (): Promise<ConversationWithPreview[]> => {
    const res = await apiRequest("/api/conversations", "GET");
    return res.json();
  },

  getById: async (id: number): Promise<Conversation> => {
    const res = await apiRequest(`/api/conversations/${id}`, "GET");
    return res.json();
  },

  create: async (data: { message: string; type: string; collectionId?: number; attachments?: File[] }): Promise<{ conversation: Conversation; messages: Message[] }> => {
    if (data.attachments && data.attachments.length > 0) {
      // Use FormData for file uploads
      const formData = new FormData();
      formData.append("message", data.message);
      formData.append("type", data.type);
      if (data.collectionId) {
        formData.append("collectionId", data.collectionId.toString());
      }
      
      data.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const res = await fetch("/api/conversations", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return res.json();
    } else {
      // Use regular JSON for text-only messages
      const res = await apiRequest("/api/conversations", "POST", data);
      return res.json();
    }
  },
};

// Messages API
export const messagesApi = {
  getByConversation: async (conversationId: number): Promise<Message[]> => {
    const res = await apiRequest(`/api/conversations/${conversationId}/messages`, "GET");
    return res.json();
  },

  send: async (conversationId: number, content: string): Promise<Message[]> => {
    const res = await apiRequest(`/api/conversations/${conversationId}/messages`, "POST", { content });
    return res.json();
  },
};

// Communities API
export const communitiesApi = {
  join: async (communityId: number): Promise<void> => {
    await apiRequest(`/api/communities/${communityId}/join`, "POST");
  },

  leave: async (communityId: number): Promise<void> => {
    await apiRequest(`/api/communities/${communityId}/leave`, "DELETE");
  },
};
