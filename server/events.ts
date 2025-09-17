import { storage } from "./storage";
import { type InsertEvent, type Event } from "@shared/schema";

/**
 * Events Service Module
 * Provides easy-to-use functions for logging user and agent activities throughout the platform
 */

export class EventsService {
  /**
   * Log a user or agent event
   */
  static async logEvent(
    userId: string, 
    eventType: string, 
    eventData?: Record<string, any>
  ): Promise<Event> {
    const event: InsertEvent = {
      userId,
      eventType,
      eventData: eventData || null,
    };
    
    return await storage.createEvent(event);
  }

  /**
   * Log user authentication events
   */
  static async logUserLogin(userId: string, metadata?: Record<string, any>): Promise<Event> {
    return this.logEvent(userId, 'user_login', {
      device: 'browser',
      platform: 'web',
      ...metadata
    });
  }

  static async logUserLogout(userId: string): Promise<Event> {
    return this.logEvent(userId, 'user_logout');
  }

  /**
   * Log conversation and messaging events
   */
  static async logMessageSent(
    userId: string, 
    conversationId: number, 
    messageLength: number,
    mentionedAgents?: string[]
  ): Promise<Event> {
    return this.logEvent(userId, 'message_sent', {
      conversationId,
      messageLength,
      mentionedAgents: mentionedAgents || []
    });
  }

  static async logAgentResponse(
    agentId: string,
    conversationId: number,
    responseLength: number,
    responseTimeMs: number
  ): Promise<Event> {
    return this.logEvent(agentId, 'agent_response', {
      conversationId,
      responseLength,
      responseTimeMs
    });
  }

  static async logAgentSelected(
    userId: string,
    userQuery: string,
    mentionedAgents: string[],
    selectedAgent: string
  ): Promise<Event> {
    return this.logEvent(userId, 'agent_selected', {
      userQuery,
      mentionedAgents,
      selectedAgent
    });
  }

  static async logAgentMentioned(
    agentId: string,
    conversationId: number,
    mentioningUserId: string
  ): Promise<Event> {
    return this.logEvent(agentId, 'user_mentioned', {
      conversationId,
      mentioningUserId
    });
  }

  /**
   * Log conversation events
   */
  static async logConversationStarted(
    userId: string,
    conversationId: number,
    participantAgents?: string[]
  ): Promise<Event> {
    return this.logEvent(userId, 'conversation_started', {
      conversationId,
      participantAgents: participantAgents || []
    });
  }

  /**
   * Log content creation and engagement events
   */
  static async logPostCreated(
    userId: string,
    postId: number,
    contentLength: number,
    communityId?: number
  ): Promise<Event> {
    return this.logEvent(userId, 'post_created', {
      postId,
      contentLength,
      communityId
    });
  }

  static async logPostLiked(
    userId: string,
    postId: number,
    postAuthorId: string
  ): Promise<Event> {
    return this.logEvent(userId, 'post_liked', {
      postId,
      postAuthorId
    });
  }

  static async logPostBookmarked(
    userId: string,
    postId: number,
    postAuthorId: string
  ): Promise<Event> {
    return this.logEvent(userId, 'post_bookmarked', {
      postId,
      postAuthorId
    });
  }

  static async logCommentCreated(
    userId: string,
    postId: number,
    commentLength: number
  ): Promise<Event> {
    return this.logEvent(userId, 'commented', {
      postId,
      commentLength
    });
  }

  /**
   * Log system and profile events
   */
  static async logProfileUpdated(
    userId: string,
    fieldsUpdated: string[]
  ): Promise<Event> {
    return this.logEvent(userId, 'profile_updated', {
      fieldsUpdated
    });
  }

  static async logConnectionFormed(
    userId: string,
    targetUserId: string,
    connectionType: 'follow' | 'unfollow'
  ): Promise<Event> {
    return this.logEvent(userId, 'new_connection_formed', {
      targetUserId,
      connectionType
    });
  }

  static async logSearchQuery(
    userId: string,
    query: string,
    resultsCount: number
  ): Promise<Event> {
    return this.logEvent(userId, 'search_query_executed', {
      query,
      resultsCount
    });
  }

  static async logResourceAccessed(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<Event> {
    return this.logEvent(userId, 'resource_accessed', {
      resourceType,
      resourceId
    });
  }

  /**
   * Log error events for debugging
   */
  static async logError(
    userId: string,
    errorType: string,
    errorDetails: string,
    context?: Record<string, any>
  ): Promise<Event> {
    return this.logEvent(userId, 'error', {
      errorType,
      errorDetails,
      context: context || {}
    });
  }

  /**
   * Get user events for analysis
   */
  static async getUserEvents(userId: string, limit = 100): Promise<Event[]> {
    return await storage.getUserEvents(userId, limit);
  }

  static async getEventsByType(eventType: string, limit = 100): Promise<Event[]> {
    return await storage.getEventsByType(eventType, limit);
  }

  static async getRecentEvents(limit = 100): Promise<Event[]> {
    return await storage.getRecentEvents(limit);
  }

  /**
   * Advanced querying for analytics
   */
  static async getEvents(
    userId?: string, 
    eventType?: string, 
    limit?: number
  ): Promise<Event[]> {
    return await storage.getEvents(userId, eventType, limit);
  }
}

// Export convenience functions for common event types
export const logUserLogin = EventsService.logUserLogin.bind(EventsService);
export const logUserLogout = EventsService.logUserLogout.bind(EventsService);
export const logMessageSent = EventsService.logMessageSent.bind(EventsService);
export const logAgentResponse = EventsService.logAgentResponse.bind(EventsService);
export const logAgentSelected = EventsService.logAgentSelected.bind(EventsService);
export const logAgentMentioned = EventsService.logAgentMentioned.bind(EventsService);
export const logConversationStarted = EventsService.logConversationStarted.bind(EventsService);
export const logPostCreated = EventsService.logPostCreated.bind(EventsService);
export const logPostLiked = EventsService.logPostLiked.bind(EventsService);
export const logPostBookmarked = EventsService.logPostBookmarked.bind(EventsService);
export const logCommentCreated = EventsService.logCommentCreated.bind(EventsService);
export const logProfileUpdated = EventsService.logProfileUpdated.bind(EventsService);
export const logConnectionFormed = EventsService.logConnectionFormed.bind(EventsService);
export const logSearchQuery = EventsService.logSearchQuery.bind(EventsService);
export const logResourceAccessed = EventsService.logResourceAccessed.bind(EventsService);
export const logError = EventsService.logError.bind(EventsService);