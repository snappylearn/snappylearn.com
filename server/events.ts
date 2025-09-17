import { storage } from "./storage";
import { type InsertEvent, type Event } from "@shared/schema";
import { PostHog } from 'posthog-node';

/**
 * Events Service Module
 * Provides easy-to-use functions for logging user and agent activities throughout the platform
 * Integrates with PostHog for comprehensive analytics tracking
 */

// Initialize PostHog client (only if API key is provided)
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
const NODE_ENV = process.env.NODE_ENV || 'development';

let posthog: PostHog | null = null;
if (POSTHOG_API_KEY) {
  posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    requestTimeout: 5000,
  });
  
  // Graceful shutdown handling
  process.on('SIGTERM', () => posthog?.shutdown());
  process.on('SIGINT', () => posthog?.shutdown());
}

export class EventsService {
  /**
   * Log a user or agent event
   * Stores in database and sends to PostHog for analytics
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
    
    // Store event in database
    const createdEvent = await storage.createEvent(event);
    
    // Send to PostHog for analytics (async, don't block on errors)
    if (posthog) {
      try {
        posthog.capture({
          distinctId: userId,
          event: eventType,
          properties: {
            timestamp: new Date().toISOString(),
            platform: 'curiosity_engine',
            environment: NODE_ENV,
            ...eventData, // Allow eventData to override defaults
          }
        });
      } catch (error) {
        console.warn('PostHog event tracking failed:', error);
      }
    }
    
    return createdEvent;
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

  // ==========================================
  // COMPREHENSIVE EVENTS TAXONOMY METHODS
  // ==========================================

  /**
   * 1. AUTHENTICATION & SESSION EVENTS
   */
  static async logAppLaunched(
    userId: string,
    deviceType?: string,
    osVersion?: string,
    browserVersion?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'app_launched', {
      deviceType,
      osVersion,
      browserVersion
    });
  }

  static async logUserSignedUp(
    userId: string,
    signupMethod: string,
    isFirstTimeUser: boolean,
    referralSource?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'user_signed_up', {
      signupMethod,
      isFirstTimeUser,
      referralSource
    });
  }

  static async logUserSignedIn(
    userId: string,
    loginMethod: string,
    deviceFingerprint?: string,
    ipAddress?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'user_signed_in', {
      loginMethod,
      deviceFingerprint,
      ipAddress
    });
  }

  static async logUserSignedOut(
    userId: string,
    sessionDurationMinutes: number,
    logoutMethod: string
  ): Promise<Event> {
    return this.logEvent(userId, 'user_signed_out', {
      sessionDurationMinutes,
      logoutMethod
    });
  }

  /**
   * 2. NAVIGATION & PAGE EVENTS
   */
  static async logPageViewed(
    userId: string,
    pageName: string,
    pageUrl: string,
    referrerUrl?: string,
    loadTimeMs?: number
  ): Promise<Event> {
    return this.logEvent(userId, 'page_viewed', {
      pageName,
      pageUrl,
      referrerUrl,
      loadTimeMs
    });
  }

  static async logSearchPerformed(
    userId: string,
    searchQuery: string,
    searchType: string,
    resultCount: number,
    filterApplied?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'search_performed', {
      searchQuery,
      searchType,
      resultCount,
      filterApplied
    });
  }

  /**
   * 3. CONTENT CREATION & MANAGEMENT EVENTS
   */
  static async logPostUpdated(
    userId: string,
    postId: number,
    fieldUpdated: string,
    originalLength?: number,
    newLength?: number,
    editReason?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'post_updated', {
      postId,
      fieldUpdated,
      originalLength,
      newLength,
      editReason
    });
  }

  static async logPostDeleted(
    userId: string,
    postId: number,
    deletionReason?: string,
    postAgeHours?: number,
    engagementCount?: number
  ): Promise<Event> {
    return this.logEvent(userId, 'post_deleted', {
      postId,
      deletionReason,
      postAgeHours,
      engagementCount
    });
  }

  static async logCommentUpdated(
    userId: string,
    commentId: number,
    originalLength: number,
    newLength: number,
    editReason?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'comment_updated', {
      commentId,
      originalLength,
      newLength,
      editReason
    });
  }

  static async logCommentDeleted(
    userId: string,
    commentId: number,
    deletionReason?: string,
    replyCount?: number,
    commentAgeHours?: number
  ): Promise<Event> {
    return this.logEvent(userId, 'comment_deleted', {
      commentId,
      deletionReason,
      replyCount,
      commentAgeHours
    });
  }

  /**
   * 4. SOCIAL INTERACTION EVENTS
   */
  static async logLikeCreated(
    userId: string,
    targetId: number,
    targetType: string,
    targetAuthorId: string,
    isFirstLike?: boolean
  ): Promise<Event> {
    return this.logEvent(userId, 'like_created', {
      targetId,
      targetType,
      targetAuthorId,
      isFirstLike
    });
  }

  static async logLikeDeleted(
    userId: string,
    targetId: number,
    targetType: string,
    targetAuthorId: string,
    likeDurationSeconds?: number
  ): Promise<Event> {
    return this.logEvent(userId, 'like_deleted', {
      targetId,
      targetType,
      targetAuthorId,
      likeDurationSeconds
    });
  }

  static async logShareCreated(
    userId: string,
    originalPostId: number,
    originalAuthorId: string,
    newPostId: number,
    shareCaptionLength?: number,
    sharePlatform?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'share_created', {
      originalPostId,
      originalAuthorId,
      newPostId,
      shareCaptionLength,
      sharePlatform
    });
  }

  static async logBookmarkCreated(
    userId: string,
    targetPostId: number,
    targetAuthorId: string,
    collectionName?: string,
    bookmarkCategory?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'bookmark_created', {
      targetPostId,
      targetAuthorId,
      collectionName,
      bookmarkCategory
    });
  }

  static async logUserFollowed(
    userId: string,
    targetUserId: string,
    targetUserTypeId: number,
    followSource?: string,
    mutualConnection?: boolean
  ): Promise<Event> {
    return this.logEvent(userId, 'user_followed', {
      targetUserId,
      targetUserTypeId,
      followSource,
      mutualConnection
    });
  }

  /**
   * 5. AI AGENT & CONVERSATION EVENTS
   */
  static async logConversationEnded(
    userId: string,
    conversationId: number,
    endReason: string,
    durationMinutes: number,
    messageCount: number,
    participantCount: number
  ): Promise<Event> {
    return this.logEvent(userId, 'conversation_ended', {
      conversationId,
      endReason,
      durationMinutes,
      messageCount,
      participantCount
    });
  }

  static async logAgentResponseGenerated(
    agentId: string,
    conversationId: number,
    responseLengthChars: number,
    generationTimeMs: number,
    modelVersion?: string
  ): Promise<Event> {
    return this.logEvent(agentId, 'agent_response_generated', {
      conversationId,
      responseLengthChars,
      generationTimeMs,
      modelVersion
    });
  }

  static async logHistoricalContextRequested(
    userId: string,
    agentId: string,
    historicalPeriod: string,
    topic: string,
    contextDepth?: string
  ): Promise<Event> {
    return this.logEvent(userId, 'historical_context_requested', {
      agentId,
      historicalPeriod,
      topic,
      contextDepth
    });
  }

  static async logEducationalMomentCreated(
    agentId: string,
    topic: string,
    educationalDepth: string,
    engagementScore?: number
  ): Promise<Event> {
    return this.logEvent(agentId, 'educational_moment_created', {
      topic,
      educationalDepth,
      engagementScore
    });
  }

  /**
   * 6. AUTONOMOUS WORKFLOW EVENTS
   */
  static async logWorkflowTriggered(
    agentId: string,
    workflowName: string,
    triggerMethod: string,
    triggerConditions?: Record<string, any>,
    executionId?: string
  ): Promise<Event> {
    return this.logEvent(agentId, 'workflow_triggered', {
      workflowName,
      triggerMethod,
      triggerConditions,
      executionId
    });
  }

  static async logWorkflowCompleted(
    agentId: string,
    workflowName: string,
    executionTimeMs: number,
    success: boolean,
    actionsTaken: string[],
    executionId?: string
  ): Promise<Event> {
    return this.logEvent(agentId, 'workflow_completed', {
      workflowName,
      executionTimeMs,
      success,
      actionsTaken,
      executionId
    });
  }

  static async logWorkflowFailed(
    agentId: string,
    workflowName: string,
    errorType: string,
    errorMessage: string,
    retryCount?: number,
    executionId?: string
  ): Promise<Event> {
    return this.logEvent(agentId, 'workflow_failed', {
      workflowName,
      errorType,
      errorMessage,
      retryCount,
      executionId
    });
  }

  static async logLlmDecisionLogged(
    agentId: string,
    workflowName: string,
    decisionType: string,
    decisionResult: string,
    confidenceScore: number,
    reasoningSummary?: string
  ): Promise<Event> {
    return this.logEvent(agentId, 'llm_decision_logged', {
      workflowName,
      decisionType,
      decisionResult,
      confidenceScore,
      reasoningSummary
    });
  }

  static async logLlmPromptExecuted(
    agentId: string,
    workflowName: string,
    promptType: string,
    promptTokens: number,
    completionTokens: number,
    responseTimeMs: number
  ): Promise<Event> {
    return this.logEvent(agentId, 'llm_prompt_executed', {
      workflowName,
      promptType,
      promptTokens,
      completionTokens,
      responseTimeMs
    });
  }

  static async logThresholdExceeded(
    agentId: string,
    thresholdType: string,
    currentValue: number,
    limitValue: number,
    actionTaken: string
  ): Promise<Event> {
    return this.logEvent(agentId, 'threshold_exceeded', {
      thresholdType,
      currentValue,
      limitValue,
      actionTaken
    });
  }

  /**
   * 7. DOCUMENT & COLLECTION EVENTS
   */
  static async logDocumentUploaded(
    userId: string,
    documentId: number,
    fileType: string,
    fileSizeBytes: number,
    collectionId?: number,
    extractionSuccess?: boolean
  ): Promise<Event> {
    return this.logEvent(userId, 'document_uploaded', {
      documentId,
      fileType,
      fileSizeBytes,
      collectionId,
      extractionSuccess
    });
  }

  static async logCollectionCreated(
    userId: string,
    collectionId: number,
    collectionName: string,
    collectionType: string,
    privacyLevel: string
  ): Promise<Event> {
    return this.logEvent(userId, 'collection_created', {
      collectionId,
      collectionName,
      collectionType,
      privacyLevel
    });
  }

  /**
   * 8. PERFORMANCE & ANALYTICS EVENTS
   */
  static async logApiCallMade(
    userId: string,
    endpoint: string,
    method: string,
    responseTimeMs: number,
    statusCode: number,
    payloadSizeBytes?: number
  ): Promise<Event> {
    return this.logEvent(userId, 'api_call_made', {
      endpoint,
      method,
      responseTimeMs,
      statusCode,
      payloadSizeBytes
    });
  }

  static async logFeatureUsed(
    userId: string,
    featureName: string,
    usageContext: string,
    usageDurationSeconds?: number,
    success?: boolean
  ): Promise<Event> {
    return this.logEvent(userId, 'feature_used', {
      featureName,
      usageContext,
      usageDurationSeconds,
      success
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
// Authentication & Session
export const logAppLaunched = EventsService.logAppLaunched.bind(EventsService);
export const logUserSignedUp = EventsService.logUserSignedUp.bind(EventsService);
export const logUserSignedIn = EventsService.logUserSignedIn.bind(EventsService);
export const logUserSignedOut = EventsService.logUserSignedOut.bind(EventsService);
export const logUserLogin = EventsService.logUserLogin.bind(EventsService);
export const logUserLogout = EventsService.logUserLogout.bind(EventsService);

// Navigation & Pages
export const logPageViewed = EventsService.logPageViewed.bind(EventsService);
export const logSearchPerformed = EventsService.logSearchPerformed.bind(EventsService);
export const logSearchQuery = EventsService.logSearchQuery.bind(EventsService);

// Content Creation & Management
export const logPostCreated = EventsService.logPostCreated.bind(EventsService);
export const logPostUpdated = EventsService.logPostUpdated.bind(EventsService);
export const logPostDeleted = EventsService.logPostDeleted.bind(EventsService);
export const logCommentCreated = EventsService.logCommentCreated.bind(EventsService);
export const logCommentUpdated = EventsService.logCommentUpdated.bind(EventsService);
export const logCommentDeleted = EventsService.logCommentDeleted.bind(EventsService);

// Social Interactions
export const logLikeCreated = EventsService.logLikeCreated.bind(EventsService);
export const logLikeDeleted = EventsService.logLikeDeleted.bind(EventsService);
export const logShareCreated = EventsService.logShareCreated.bind(EventsService);
export const logBookmarkCreated = EventsService.logBookmarkCreated.bind(EventsService);
export const logPostLiked = EventsService.logPostLiked.bind(EventsService);
export const logPostBookmarked = EventsService.logPostBookmarked.bind(EventsService);
export const logUserFollowed = EventsService.logUserFollowed.bind(EventsService);
export const logConnectionFormed = EventsService.logConnectionFormed.bind(EventsService);

// AI Agents & Conversations
export const logMessageSent = EventsService.logMessageSent.bind(EventsService);
export const logAgentResponse = EventsService.logAgentResponse.bind(EventsService);
export const logAgentSelected = EventsService.logAgentSelected.bind(EventsService);
export const logAgentMentioned = EventsService.logAgentMentioned.bind(EventsService);
export const logConversationStarted = EventsService.logConversationStarted.bind(EventsService);
export const logConversationEnded = EventsService.logConversationEnded.bind(EventsService);
export const logAgentResponseGenerated = EventsService.logAgentResponseGenerated.bind(EventsService);
export const logHistoricalContextRequested = EventsService.logHistoricalContextRequested.bind(EventsService);
export const logEducationalMomentCreated = EventsService.logEducationalMomentCreated.bind(EventsService);

// Autonomous Workflows
export const logWorkflowTriggered = EventsService.logWorkflowTriggered.bind(EventsService);
export const logWorkflowCompleted = EventsService.logWorkflowCompleted.bind(EventsService);
export const logWorkflowFailed = EventsService.logWorkflowFailed.bind(EventsService);
export const logLlmDecisionLogged = EventsService.logLlmDecisionLogged.bind(EventsService);
export const logLlmPromptExecuted = EventsService.logLlmPromptExecuted.bind(EventsService);
export const logThresholdExceeded = EventsService.logThresholdExceeded.bind(EventsService);

// Documents & Collections
export const logDocumentUploaded = EventsService.logDocumentUploaded.bind(EventsService);
export const logCollectionCreated = EventsService.logCollectionCreated.bind(EventsService);

// Performance & Analytics
export const logApiCallMade = EventsService.logApiCallMade.bind(EventsService);
export const logFeatureUsed = EventsService.logFeatureUsed.bind(EventsService);

// System & Profiles
export const logProfileUpdated = EventsService.logProfileUpdated.bind(EventsService);
export const logResourceAccessed = EventsService.logResourceAccessed.bind(EventsService);
export const logError = EventsService.logError.bind(EventsService);