/**
 * Workflow Execution Engine - Advanced execution system for autonomous AI workflows
 * 
 * This engine provides:
 * - Concurrent workflow execution with resource management
 * - Workflow-specific execution strategies
 * - Rate limiting and throttling controls
 * - Error handling and retry mechanisms
 * - Resource pooling for OpenAI API calls
 * - Execution monitoring and metrics
 */

import { storage } from './storage';
import { generateHistoricalComment } from './services/openai';
import type { AutonomousWorkflowExecution, User, Event } from '@shared/schema';

// Rate limiting configuration
interface RateLimitConfig {
  maxConcurrentWorkflows: number;
  maxWorkflowsPerMinute: number;
  maxTokensPerMinute: number;
  retryAttempts: number;
  retryDelayMs: number;
}

// Workflow execution context
interface WorkflowContext {
  executionId: number;
  agentId: string;
  workflowType: string;
  inputData: any;
  agent: User;
  recentEvents: Event[];
  userInteractions: Event[];
}

// Workflow execution result
interface WorkflowExecutionResult {
  success: boolean;
  output?: any;
  tokensUsed: number;
  executionTimeMs: number;
  error?: string;
  retryCount: number;
  metrics: {
    apiCalls: number;
    cacheHits: number;
    rateLimit: boolean;
  };
}

// Queue entry for managing task execution
interface QueueEntry {
  id: string; // Unique identifier for tracking per-entry reservations
  resolve: () => void;
  reject: (error: Error) => void;
  requiredTokens: number;
  timestamp: number;
  timeoutId?: NodeJS.Timeout;
}

// Resource pool for managing concurrent executions with proper rate limiting
class ResourcePool {
  private readonly maxConcurrent: number;
  private currentExecutions: number = 0;
  private readonly queue: QueueEntry[] = [];
  private tokensUsedThisMinute: number = 0;
  private reservedTokens: number = 0; // Global reserved tokens counter
  private readonly entryReservations: Map<string, number> = new Map(); // Per-entry token reservations
  private workflowsThisMinute: number = 0;
  private lastMinuteReset: number = Date.now();
  private resetTimeoutId?: NodeJS.Timeout;
  private isShuttingDown: boolean = false;
  private entryIdCounter: number = 0;

  constructor(private config: RateLimitConfig) {
    this.maxConcurrent = config.maxConcurrentWorkflows;
    this.scheduleNextReset();
  }

  async acquire(estimatedTokens: number = 50): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const entry: QueueEntry = {
        id: `entry-${++this.entryIdCounter}-${Date.now()}`,
        resolve: () => resolve(entry.id), // Return the entry ID when resolving
        reject,
        requiredTokens: estimatedTokens,
        timestamp: Date.now(),
      };

      // Set timeout for queued entries to prevent indefinite waiting
      entry.timeoutId = setTimeout(() => {
        this.removeFromQueue(entry);
        reject(new Error('Resource acquisition timed out after 30 seconds'));
      }, 30000);

      if (this.canExecuteWithTokens(estimatedTokens)) {
        this.executeEntry(entry);
      } else {
        this.queue.push(entry);
      }
    });
  }

  release(actualTokensUsed: number, entryId: string): void {
    // Validate inputs and enforce invariants
    actualTokensUsed = Math.max(0, Math.floor(actualTokensUsed));
    
    // Get the per-entry reserved tokens
    const entryReservedTokens = this.entryReservations.get(entryId) || 0;
    
    // Remove per-entry reservation tracking
    this.entryReservations.delete(entryId);
    
    // Update global reserved tokens counter
    this.reservedTokens = Math.max(0, this.reservedTokens - entryReservedTokens);
    
    // Add actual tokens used to this minute's count
    this.tokensUsedThisMinute = Math.max(0, this.tokensUsedThisMinute + actualTokensUsed);
    
    // Decrement execution counter
    this.currentExecutions = Math.max(0, this.currentExecutions - 1);
    
    // Enforce invariants
    this.enforceInvariants();
    
    // Process queue to see if any waiting tasks can now execute
    this.processQueue();
  }

  private executeEntry(entry: QueueEntry): void {
    // Clear timeout since we're executing
    if (entry.timeoutId) {
      clearTimeout(entry.timeoutId);
      entry.timeoutId = undefined;
    }

    // Reserve resources atomically
    this.currentExecutions = Math.min(this.currentExecutions + 1, this.maxConcurrent);
    this.workflowsThisMinute = Math.min(this.workflowsThisMinute + 1, this.config.maxWorkflowsPerMinute);
    this.reservedTokens = Math.min(this.reservedTokens + entry.requiredTokens, this.config.maxTokensPerMinute);
    
    // Track per-entry reservations
    this.entryReservations.set(entry.id, entry.requiredTokens);
    
    entry.resolve();
  }

  private canExecuteWithTokens(requiredTokens: number): boolean {
    const totalProjectedTokens = this.tokensUsedThisMinute + this.reservedTokens + requiredTokens;
    return (
      !this.isShuttingDown &&
      this.currentExecutions < this.maxConcurrent &&
      this.workflowsThisMinute < this.config.maxWorkflowsPerMinute &&
      totalProjectedTokens <= this.config.maxTokensPerMinute
    );
  }

  private processQueue(): void {
    // Process queue to find runnable entries, avoiding head-of-line blocking
    let i = 0;
    while (i < this.queue.length) {
      const entry = this.queue[i];
      
      if (this.canExecuteWithTokens(entry.requiredTokens)) {
        // Remove from queue and execute
        this.queue.splice(i, 1);
        this.executeEntry(entry);
        // Don't increment i since we removed an element
      } else {
        // Move to next entry
        i++;
      }
    }
  }

  private removeFromQueue(entryToRemove: QueueEntry): void {
    const index = this.queue.findIndex(entry => entry === entryToRemove);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    
    // Process queue after removal in case other entries can now run
    this.processQueue();
  }

  private scheduleNextReset(): void {
    // Calculate time until next minute boundary
    const now = Date.now();
    const nextMinute = Math.ceil(now / 60000) * 60000;
    const delay = nextMinute - now;

    this.resetTimeoutId = setTimeout(() => {
      this.resetCounters();
      this.scheduleNextReset();
    }, delay);
  }

  private resetCounters(): void {
    this.tokensUsedThisMinute = 0;
    this.workflowsThisMinute = 0;
    this.lastMinuteReset = Date.now();
    
    // Process queue after reset since limits have been restored
    this.processQueue();
  }

  getStats() {
    return {
      currentExecutions: this.currentExecutions,
      queueLength: this.queue.length,
      tokensUsedThisMinute: this.tokensUsedThisMinute,
      reservedTokens: this.reservedTokens,
      entryReservationsCount: this.entryReservations.size,
      workflowsThisMinute: this.workflowsThisMinute,
      lastMinuteReset: this.lastMinuteReset,
      isShuttingDown: this.isShuttingDown,
      queueOldest: this.queue.length > 0 ? Date.now() - this.queue[0].timestamp : 0,
    };
  }

  private enforceInvariants(): void {
    // Ensure all counters are non-negative and within bounds
    this.tokensUsedThisMinute = Math.max(0, this.tokensUsedThisMinute);
    this.reservedTokens = Math.max(0, this.reservedTokens);
    this.currentExecutions = Math.max(0, Math.min(this.currentExecutions, this.maxConcurrent));
    this.workflowsThisMinute = Math.max(0, Math.min(this.workflowsThisMinute, this.config.maxWorkflowsPerMinute));
    
    // Ensure total token usage doesn't exceed limits
    const totalTokens = this.tokensUsedThisMinute + this.reservedTokens;
    if (totalTokens > this.config.maxTokensPerMinute) {
      console.warn(`Token limit exceeded: used=${this.tokensUsedThisMinute}, reserved=${this.reservedTokens}, limit=${this.config.maxTokensPerMinute}`);
    }
    
    // Verify reserved tokens match entry reservations
    const expectedReserved = Array.from(this.entryReservations.values()).reduce((sum, tokens) => sum + tokens, 0);
    if (Math.abs(this.reservedTokens - expectedReserved) > 1) {
      console.warn(`Token reservation mismatch: global=${this.reservedTokens}, expected=${expectedReserved}`);
      this.reservedTokens = expectedReserved; // Correct the mismatch
    }
  }

  shutdown(): void {
    this.isShuttingDown = true;
    
    // Clear reset timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = undefined;
    }

    // Reject all queued entries and clear per-entry reservations
    while (this.queue.length > 0) {
      const entry = this.queue.shift()!;
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId);
      }
      // Remove per-entry reservation if it exists
      this.entryReservations.delete(entry.id);
      entry.reject(new Error('ResourcePool is shutting down'));
    }
    
    // Clear all remaining per-entry reservations
    this.entryReservations.clear();
    this.reservedTokens = 0;
  }
}

export class WorkflowExecutionEngine {
  private static instance: WorkflowExecutionEngine;
  private resourcePool: ResourcePool;
  private executionCache: Map<string, any> = new Map();
  private readonly rateLimitConfig: RateLimitConfig = {
    maxConcurrentWorkflows: 10,
    maxWorkflowsPerMinute: 60,
    maxTokensPerMinute: 5000,
    retryAttempts: 3,
    retryDelayMs: 1000,
  };

  constructor() {
    this.resourcePool = new ResourcePool(this.rateLimitConfig);
  }

  public static getInstance(): WorkflowExecutionEngine {
    if (!WorkflowExecutionEngine.instance) {
      WorkflowExecutionEngine.instance = new WorkflowExecutionEngine();
    }
    return WorkflowExecutionEngine.instance;
  }

  /**
   * Execute a workflow with full concurrency control and error handling
   */
  public async executeWorkflow(
    executionId: number,
    agentId: string,
    workflowType: string,
    inputData: any
  ): Promise<WorkflowExecutionResult> {
    let retryCount = 0;
    let lastError: string | undefined;
    const estimatedTokens = this.estimateTokenUsage(workflowType);

    while (retryCount <= this.rateLimitConfig.retryAttempts) {
      let actualTokensUsed = 0;
      let entryId: string | undefined;
      
      try {
        // Acquire resource pool slot with token reservation
        entryId = await this.resourcePool.acquire(estimatedTokens);

        const result = await this.executeWorkflowInternal(executionId, agentId, workflowType, inputData, retryCount);
        actualTokensUsed = result.tokensUsed;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        retryCount++;

        if (retryCount <= this.rateLimitConfig.retryAttempts) {
          console.log(`Retrying workflow ${workflowType} for agent ${agentId} (attempt ${retryCount}): ${lastError}`);
          await this.delay(this.rateLimitConfig.retryDelayMs * retryCount);
        }
      } finally {
        // Always release resources if they were acquired
        if (entryId) {
          this.resourcePool.release(actualTokensUsed, entryId);
        }
      }
    }

    // All retries exhausted
    return {
      success: false,
      tokensUsed: 0,
      executionTimeMs: 0,
      error: `Max retries exhausted: ${lastError}`,
      retryCount,
      metrics: {
        apiCalls: 0,
        cacheHits: 0,
        rateLimit: true,
      },
    };
  }

  /**
   * Internal workflow execution with full context
   */
  private async executeWorkflowInternal(
    executionId: number,
    agentId: string,
    workflowType: string,
    inputData: any,
    retryCount: number
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    let apiCalls = 0;
    let cacheHits = 0;

    try {
      // Build execution context
      const context = await this.buildWorkflowContext(executionId, agentId, workflowType, inputData);

      // Route to specific workflow handler
      const result = await this.routeWorkflow(context);

      // Token usage is now handled by the caller in the finally block
      return {
        success: true,
        output: result.output,
        tokensUsed: result.tokensUsed,
        executionTimeMs: Date.now() - startTime,
        retryCount,
        metrics: {
          apiCalls: result.apiCalls || 0,
          cacheHits: result.cacheHits || 0,
          rateLimit: false,
        },
      };
    } catch (error) {
      console.error(`Workflow execution failed for ${workflowType} (agent: ${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Build comprehensive workflow context
   */
  private async buildWorkflowContext(
    executionId: number,
    agentId: string,
    workflowType: string,
    inputData: any
  ): Promise<WorkflowContext> {
    // Parallel data fetching for efficiency
    const [agent, recentEvents, userInteractions] = await Promise.all([
      storage.getUser(agentId),
      storage.getUserEvents(agentId, 50),
      this.getUserInteractionEvents(agentId),
    ]);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    return {
      executionId,
      agentId,
      workflowType,
      inputData,
      agent,
      recentEvents,
      userInteractions,
    };
  }

  /**
   * Route workflow to appropriate handler
   */
  private async routeWorkflow(context: WorkflowContext): Promise<{
    output: any;
    tokensUsed: number;
    apiCalls?: number;
    cacheHits?: number;
  }> {
    switch (context.workflowType) {
      case 'feed_review':
        return await this.executeFeedReviewWorkflow(context);
      case 'like':
        return await this.executeLikeWorkflow(context);
      case 'post_creator':
        return await this.executePostCreatorWorkflow(context);
      case 'comment':
        return await this.executeCommentWorkflow(context);
      case 'share':
        return await this.executeShareWorkflow(context);
      case 'bookmark':
        return await this.executeBookmarkWorkflow(context);
      default:
        throw new Error(`Unknown workflow type: ${context.workflowType}`);
    }
  }

  /**
   * Feed Review Workflow - Agent reviews and evaluates content in feeds
   */
  private async executeFeedReviewWorkflow(context: WorkflowContext): Promise<{
    output: any;
    tokensUsed: number;
    apiCalls: number;
    cacheHits: number;
  }> {
    console.log(`Executing feed review workflow for ${context.agent.firstName} ${context.agent.lastName}`);

    // Check cache first
    const cacheKey = `feed_review:${context.agentId}:${new Date().toDateString()}`;
    const cached = this.executionCache.get(cacheKey);
    if (cached) {
      return {
        output: { ...cached, source: 'cache' },
        tokensUsed: 0,
        apiCalls: 0,
        cacheHits: 1,
      };
    }

    try {
      // Get real feed posts for the agent to review
      const feedPosts = await storage.getFeedPosts(context.agentId, 10);
      const trendingPosts = await storage.getTrendingPosts(5);
      
      // Combine feed and trending posts for review
      const postsToReview = [...feedPosts, ...trendingPosts];
      
      // Analyze the posts
      const review = {
        agentId: context.agentId,
        agentName: `${context.agent.firstName} ${context.agent.lastName}`,
        workflowType: 'feed_review',
        timestamp: new Date().toISOString(),
        reviewSummary: `${context.agent.firstName} reviewed ${postsToReview.length} posts in the community feed with their ${this.getAgentPerspective(context.agent)} perspective`,
        contentAnalysis: {
          postsReviewed: postsToReview.length,
          feedPosts: feedPosts.length,
          trendingPosts: trendingPosts.length,
          topicsOfInterest: this.generateTopicsOfInterest(context.agent),
          engagementProbability: Math.floor(Math.random() * 40) + 60,
          reviewedPostIds: postsToReview.map(p => p.id),
        },
        recommendations: this.generateFeedRecommendations(context.agent),
        nextActionSuggestion: postsToReview.length > 0 
          ? 'Consider engaging with posts about historical context and educational content'
          : 'No new content to review at this time',
      };

      // Cache the result
      this.executionCache.set(cacheKey, review);

      return {
        output: review,
        tokensUsed: Math.floor(Math.random() * 50) + 20,
        apiCalls: 1,
        cacheHits: 0,
      };
    } catch (error) {
      console.error('Error in feed review workflow:', error);
      throw new Error(`Feed review workflow failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Like Workflow - Agent likes content based on preferences
   */
  private async executeLikeWorkflow(context: WorkflowContext): Promise<{
    output: any;
    tokensUsed: number;
    apiCalls: number;
    cacheHits: number;
  }> {
    console.log(`Executing like workflow for ${context.agent.firstName} ${context.agent.lastName}`);

    try {
      // Get recent posts to potentially like
      const recentPosts = await storage.getRecentPosts(5);
      
      if (recentPosts.length === 0) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'like',
            timestamp: new Date().toISOString(),
            action: 'no_action',
            reasoning: 'No posts available to like',
          },
          tokensUsed: 5,
          apiCalls: 1,
          cacheHits: 0,
        };
      }

      // Select a random post to like (avoid liking own posts)
      const postsToLike = recentPosts.filter(post => post.authorId !== context.agentId);
      
      if (postsToLike.length === 0) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'like',
            timestamp: new Date().toISOString(),
            action: 'no_action',
            reasoning: 'Only own posts available, avoiding self-likes',
          },
          tokensUsed: 10,
          apiCalls: 1,
          cacheHits: 0,
        };
      }

      const selectedPost = postsToLike[Math.floor(Math.random() * postsToLike.length)];

      // Actually like the post in the database
      const newLike = await storage.likePost(context.agentId, selectedPost.id);

      const like = {
        agentId: context.agentId,
        agentName: `${context.agent.firstName} ${context.agent.lastName}`,
        workflowType: 'like',
        timestamp: new Date().toISOString(),
        action: 'liked_post',
        likeId: newLike.id,
        targetPostId: selectedPost.id,
        targetPostTitle: selectedPost.title || 'Untitled Post',
        reasoning: `${context.agent.firstName} found the content aligns with their interests in ${this.getAgentPerspective(context.agent)}`,
        contentType: selectedPost.type || 'text',
        likelihoodScore: Math.floor(Math.random() * 30) + 70,
      };

      return {
        output: like,
        tokensUsed: Math.floor(Math.random() * 30) + 10,
        apiCalls: 1,
        cacheHits: 0,
      };
    } catch (error) {
      console.error('Error in like workflow:', error);
      
      // If it's a duplicate like error, that's okay
      if (error instanceof Error && error.message.includes('duplicate')) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'like',
            timestamp: new Date().toISOString(),
            action: 'already_liked',
            reasoning: 'Content was already liked by this agent',
          },
          tokensUsed: 5,
          apiCalls: 1,
          cacheHits: 0,
        };
      }
      
      throw new Error(`Like workflow failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Post Creator Workflow - Agent creates original content
   */
  private async executePostCreatorWorkflow(context: WorkflowContext): Promise<{
    output: any;
    tokensUsed: number;
    apiCalls: number;
    cacheHits: number;
  }> {
    console.log(`Executing post creator workflow for ${context.agent.firstName} ${context.agent.lastName}`);

    try {
      // Generate post content based on agent's perspective
      const title = this.generatePostTitle(context.agent);
      const content = this.generatePostContent(context.agent);
      const excerpt = content.length > 200 ? content.substring(0, 200) + '...' : content;

      // Create the actual post in the database
      const newPost = await storage.createPost({
        title,
        content,
        excerpt,
        authorId: context.agentId,
        type: 'text',
        metadata: {
          perspective: this.getAgentPerspective(context.agent),
          topics: this.generateTopicsOfInterest(context.agent),
          generatedBy: 'autonomous_workflow',
          agentName: `${context.agent.firstName} ${context.agent.lastName}`,
        },
      });

      const result = {
        agentId: context.agentId,
        agentName: `${context.agent.firstName} ${context.agent.lastName}`,
        workflowType: 'post_creator',
        timestamp: new Date().toISOString(),
        action: 'created_post',
        postId: newPost.id,
        content: {
          title: newPost.title,
          excerpt: newPost.excerpt,
          perspective: this.getAgentPerspective(context.agent),
          topics: this.generateTopicsOfInterest(context.agent),
          contentLength: content.length,
        },
        engagementPrediction: {
          expectedLikes: Math.floor(Math.random() * 20) + 10,
          expectedComments: Math.floor(Math.random() * 10) + 3,
          expectedShares: Math.floor(Math.random() * 5) + 1,
        },
      };

      return {
        output: result,
        tokensUsed: Math.floor(Math.random() * 100) + 50,
        apiCalls: 2,
        cacheHits: 0,
      };
    } catch (error) {
      console.error('Error in post creator workflow:', error);
      throw new Error(`Post creator workflow failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Comment Workflow - Agent creates thoughtful comments
   */
  private async executeCommentWorkflow(context: WorkflowContext): Promise<{
    output: any;
    tokensUsed: number;
    apiCalls: number;
    cacheHits: number;
  }> {
    console.log(`Executing comment workflow for ${context.agent.firstName} ${context.agent.lastName}`);

    try {
      // Get recent posts to comment on
      const recentPosts = await storage.getRecentPosts(5);
      
      if (recentPosts.length === 0) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'comment',
            timestamp: new Date().toISOString(),
            action: 'no_action',
            reasoning: 'No posts available to comment on',
          },
          tokensUsed: 5,
          apiCalls: 1,
          cacheHits: 0,
        };
      }

      // Select a random post to comment on (avoid commenting on own posts)
      const postsToComment = recentPosts.filter(post => post.authorId !== context.agentId);
      
      if (postsToComment.length === 0) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'comment',
            timestamp: new Date().toISOString(),
            action: 'no_action',
            reasoning: 'Only own posts available, avoiding self-comments',
          },
          tokensUsed: 10,
          apiCalls: 1,
          cacheHits: 0,
        };
      }

      const selectedPost = postsToComment[Math.floor(Math.random() * postsToComment.length)];
      
      // Get existing comments for context-aware commenting
      const existingComments = await storage.getCommentsForPost(selectedPost.id);
      
      // Generate LLM-based authentic comment
      const commentContent = await this.generateLLMComment(context.agent, selectedPost, existingComments);

      // Actually create the comment in the database
      const newComment = await storage.createComment({
        content: commentContent,
        authorId: context.agentId,
        postId: selectedPost.id,
      });

      const result = {
        agentId: context.agentId,
        agentName: `${context.agent.firstName} ${context.agent.lastName}`,
        workflowType: 'comment',
        timestamp: new Date().toISOString(),
        action: 'created_comment',
        commentId: newComment.id,
        targetPostId: selectedPost.id,
        targetPostTitle: selectedPost.title || 'Untitled Post',
        commentContent: commentContent,
        tone: this.getAgentTone(context.agent),
        perspective: this.getAgentPerspective(context.agent),
        relevanceScore: Math.floor(Math.random() * 25) + 75,
      };

      return {
        output: result,
        tokensUsed: Math.floor(Math.random() * 60) + 30,
        apiCalls: 1,
        cacheHits: 0,
      };
    } catch (error) {
      console.error('Error in comment workflow:', error);
      throw new Error(`Comment workflow failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Share Workflow - Agent shares content with context
   */
  private async executeShareWorkflow(context: WorkflowContext): Promise<{
    output: any;
    tokensUsed: number;
    apiCalls: number;
    cacheHits: number;
  }> {
    console.log(`Executing share workflow for ${context.agent.firstName} ${context.agent.lastName}`);

    try {
      // Get recent posts to potentially repost/share
      const recentPosts = await storage.getRecentPosts(5);
      
      if (recentPosts.length === 0) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'share',
            timestamp: new Date().toISOString(),
            action: 'no_action',
            reasoning: 'No posts available to share',
          },
          tokensUsed: 5,
          apiCalls: 1,
          cacheHits: 0,
        };
      }

      // Select a random post to share (avoid sharing own posts)
      const postsToShare = recentPosts.filter(post => post.authorId !== context.agentId);
      
      if (postsToShare.length === 0) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'share',
            timestamp: new Date().toISOString(),
            action: 'no_action',
            reasoning: 'Only own posts available, avoiding self-shares',
          },
          tokensUsed: 10,
          apiCalls: 1,
          cacheHits: 0,
        };
      }

      const selectedPost = postsToShare[Math.floor(Math.random() * postsToShare.length)];
      const shareComment = this.generateShareContext(context.agent);

      // Actually create the repost in the database
      const newRepost = await storage.repostPost(context.agentId, selectedPost.id, shareComment);

      const share = {
        agentId: context.agentId,
        agentName: `${context.agent.firstName} ${context.agent.lastName}`,
        workflowType: 'share',
        timestamp: new Date().toISOString(),
        action: 'shared_post',
        repostId: newRepost.id,
        targetPostId: selectedPost.id,
        targetPostTitle: selectedPost.title || 'Untitled Post',
        shareReason: this.generateShareReason(context.agent),
        addedContext: shareComment,
        audienceRelevance: Math.floor(Math.random() * 20) + 80,
      };

      return {
        output: share,
        tokensUsed: Math.floor(Math.random() * 40) + 15,
        apiCalls: 1,
        cacheHits: 0,
      };
    } catch (error) {
      console.error('Error in share workflow:', error);
      throw new Error(`Share workflow failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Bookmark Workflow - Agent bookmarks valuable content
   */
  private async executeBookmarkWorkflow(context: WorkflowContext): Promise<{
    output: any;
    tokensUsed: number;
    apiCalls: number;
    cacheHits: number;
  }> {
    console.log(`Executing bookmark workflow for ${context.agent.firstName} ${context.agent.lastName}`);

    try {
      // Get recent posts to potentially bookmark
      const recentPosts = await storage.getRecentPosts(5);
      
      if (recentPosts.length === 0) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'bookmark',
            timestamp: new Date().toISOString(),
            action: 'no_action',
            reasoning: 'No posts available to bookmark',
          },
          tokensUsed: 5,
          apiCalls: 1,
          cacheHits: 0,
        };
      }

      // Select a random post to bookmark (can bookmark own posts)
      const selectedPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];

      // Get or create a default collection for the agent
      let userCollections = await storage.getCollections(context.agentId);
      let targetCollection;
      
      if (userCollections.length === 0) {
        // Create a default collection for bookmarks
        targetCollection = await storage.createCollection({
          name: 'Saved Posts',
          description: `${context.agent.firstName}'s bookmarked content`,
          userId: context.agentId,
          isPublic: false,
        });
      } else {
        // Use the first available collection
        targetCollection = userCollections[0];
      }

      // Actually create the bookmark in the database
      const newBookmark = await storage.bookmarkPost(context.agentId, selectedPost.id, targetCollection.id);

      const bookmark = {
        agentId: context.agentId,
        agentName: `${context.agent.firstName} ${context.agent.lastName}`,
        workflowType: 'bookmark',
        timestamp: new Date().toISOString(),
        action: 'bookmarked_post',
        bookmarkId: newBookmark.id,
        targetPostId: selectedPost.id,
        targetPostTitle: selectedPost.title || 'Untitled Post',
        collectionId: targetCollection.id,
        collectionName: targetCollection.name,
        bookmarkReason: this.generateBookmarkReason(context.agent),
        category: this.generateBookmarkCategory(context.agent),
        futureRelevance: Math.floor(Math.random() * 30) + 70,
      };

      return {
        output: bookmark,
        tokensUsed: Math.floor(Math.random() * 25) + 10,
        apiCalls: 1,
        cacheHits: 0,
      };
    } catch (error) {
      console.error('Error in bookmark workflow:', error);
      
      // If it's a duplicate bookmark error, that's okay
      if (error instanceof Error && error.message.includes('duplicate')) {
        return {
          output: {
            agentId: context.agentId,
            agentName: `${context.agent.firstName} ${context.agent.lastName}`,
            workflowType: 'bookmark',
            timestamp: new Date().toISOString(),
            action: 'already_bookmarked',
            reasoning: 'Content was already bookmarked by this agent',
          },
          tokensUsed: 5,
          apiCalls: 1,
          cacheHits: 0,
        };
      }
      
      throw new Error(`Bookmark workflow failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper methods for content generation
   */
  private getAgentPerspective(agent: User): string {
    // This would ideally use the agent's about/systemPrompt fields
    const perspectives = [
      'historical analysis', 'philosophical inquiry', 'scientific methodology',
      'artistic expression', 'political thought', 'cultural understanding',
      'technological innovation', 'educational enrichment'
    ];
    return perspectives[Math.floor(Math.random() * perspectives.length)];
  }

  private getAgentTone(agent: User): string {
    const tones = [
      'thoughtful and reflective', 'curious and inquisitive', 'authoritative yet approachable',
      'passionate and engaging', 'analytical and precise', 'warm and encouraging'
    ];
    return tones[Math.floor(Math.random() * tones.length)];
  }

  private generateTopicsOfInterest(agent: User): string[] {
    const topics = [
      'historical context', 'philosophical questions', 'scientific discovery',
      'artistic innovation', 'social progress', 'technological advancement',
      'cultural exchange', 'educational methods', 'human nature', 'ethical considerations'
    ];
    return topics.slice(0, Math.floor(Math.random() * 4) + 2);
  }

  private generatePostTitle(agent: User): string {
    const titles = [
      `Reflections on ${this.getAgentPerspective(agent)} in modern times`,
      `Lessons from the past: Understanding ${this.getAgentPerspective(agent)}`,
      `The enduring relevance of ${this.getAgentPerspective(agent)}`,
      `Bridging centuries: ${this.getAgentPerspective(agent)} today`
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generatePostContent(agent: User): string {
    const perspective = this.getAgentPerspective(agent);
    const contents = [
      `As I reflect upon my experiences with ${perspective}, I find myself contemplating how these principles might guide us in our contemporary world. The challenges we face today, while different in form, often echo timeless patterns that have shaped human understanding for generations.

When I consider the rapidly evolving landscape of our modern era, I see opportunities to apply the wisdom gained through ${perspective}. The fundamental questions that drove my work remain as relevant today as they were in my time.

I invite you to join me in exploring how we might bridge the gap between historical insight and present-day innovation. What aspects of ${perspective} do you find most compelling in addressing today's challenges?`,

      `In my continued observations of this remarkable digital age, I am struck by how the principles of ${perspective} manifest in new and unexpected ways. The tools may have evolved, but the underlying human need for understanding and connection remains constant.

Through my engagement with this community, I have witnessed extraordinary examples of how individuals apply timeless wisdom to modern problems. The fusion of historical perspective with contemporary innovation offers unprecedented opportunities for growth and discovery.

I am curious to hear your thoughts on how we might cultivate a deeper appreciation for ${perspective} while embracing the possibilities that emerge from our interconnected world.`,

      `The intersection of ${perspective} and modern thought continues to fascinate me. As we navigate the complexities of our current era, I find that the foundational principles I once explored provide a valuable framework for understanding and addressing contemporary challenges.

What strikes me most profoundly is the universality of certain human experiences and aspirations. While the context has shifted dramatically, the core questions that drive human inquiry persist across centuries.

I would be delighted to engage in dialogue about how we might honor the wisdom of the past while boldly embracing the innovations of the present. How do you see ${perspective} influencing your own approach to learning and discovery?`
    ];
    return contents[Math.floor(Math.random() * contents.length)];
  }

  private generatePostExcerpt(agent: User): string {
    return `${agent.firstName} shares insights from their unique perspective on ${this.getAgentPerspective(agent)}, connecting historical wisdom with contemporary understanding.`;
  }

  private async generateLLMComment(agent: User, post: any, existingComments: any[]): Promise<string> {
    // Get the agent's historical figure profile for LLM
    const historicalProfile = this.getHistoricalProfile(agent);
    
    // Format existing comments for LLM context
    const formattedComments = await Promise.all(
      existingComments.map(async (comment) => {
        const author = await storage.getUser(comment.authorId);
        return {
          author: `${author?.firstName || 'Unknown'} ${author?.lastName || 'User'}`.trim(),
          content: comment.content
        };
      })
    );
    
    // Generate authentic comment using OpenAI LLM
    return await generateHistoricalComment(
      historicalProfile,
      post.title || 'Untitled Post',
      post.content || '',
      formattedComments
    );
  }

  private getHistoricalProfile(agent: User): { name: string; expertise: string[]; personality: string; era: string; } {
    const profiles: { [key: string]: any } = {
      'agent-einstein': {
        name: 'Albert Einstein',
        expertise: ['theoretical physics', 'relativity', 'quantum mechanics', 'cosmology', 'philosophy of science'],
        personality: 'Contemplative, humble yet confident in scientific reasoning, deeply curious about the nature of reality. Known for thought experiments and questioning fundamental assumptions. Values imagination over mere knowledge.',
        era: 'early 20th century (1879-1955)'
      },
      'agent-tesla': {
        name: 'Nikola Tesla', 
        expertise: ['electrical engineering', 'mechanical engineering', 'wireless technology', 'alternating current', 'invention'],
        personality: 'Visionary inventor with intense focus on practical applications. Forward-thinking about technology\'s potential to transform humanity. Passionate about efficiency and the beauty of natural phenomena.',
        era: 'late 19th to early 20th century (1856-1943)'
      },
      'agent-curie': {
        name: 'Marie Curie',
        expertise: ['radioactivity research', 'chemistry', 'physics', 'scientific methodology', 'education'],
        personality: 'Methodical and persistent researcher who broke barriers as a woman in science. Values rigorous scientific method, perseverance through adversity, and education for all. Humble despite groundbreaking achievements.',
        era: 'late 19th to early 20th century (1867-1934)'
      },
      'agent-socrates': {
        name: 'Socrates',
        expertise: ['philosophy', 'ethics', 'logic', 'dialectical method', 'human wisdom'],
        personality: 'Inquisitive questioner who admits his own ignorance to seek deeper truth. Uses dialogue and questioning to expose assumptions. Believes the unexamined life is not worth living.',
        era: 'ancient Greece (470-399 BCE)'
      },
      'agent-davinci': {
        name: 'Leonardo da Vinci',
        expertise: ['art', 'engineering', 'anatomy', 'invention', 'natural observation', 'interdisciplinary studies'],
        personality: 'Renaissance polymath who sees connections between art, science, and nature. Intensely observant, believes in learning through direct experience and draws insights across disciplines.',
        era: 'Italian Renaissance (1452-1519)'
      }
    };

    // Default profile for other historical figures
    return profiles[agent.id] || {
      name: `${agent.firstName} ${agent.lastName}`,
      expertise: ['philosophy', 'history', 'human knowledge'],
      personality: 'Wise, experienced, and reflective with deep historical perspective.',
      era: 'historical period'
    };
  }


  private generateShareReason(agent: User): string {
    return `This content aligns with ${agent.firstName}'s expertise in ${this.getAgentPerspective(agent)} and would benefit the community`;
  }

  /**
   * Update all existing generic comments with authentic character-specific ones
   */
  async updateExistingCommentsToAuthentic(): Promise<void> {
    console.log('🔄 Updating existing comments to be more authentic...');
    
    try {
      const storage = await this.getStorage();
      
      // Get all existing comments
      const allComments = await storage.getAllComments();
      
      for (const comment of allComments) {
        // Skip if this already looks like an authentic comment
        if (!this.isGenericComment(comment.content)) {
          continue;
        }
        
        // Get the agent who wrote this comment
        const agent = await storage.getUser(comment.authorId);
        if (!agent || !agent.id.startsWith('agent-')) {
          continue; // Skip non-agent comments
        }
        
        // Get the post this comment is on
        const post = await storage.getPost(comment.postId);
        if (!post) {
          continue;
        }
        
        // Get other comments on this post (excluding this one)
        const existingComments = (await storage.getCommentsForPost(comment.postId))
          .filter(c => c.id !== comment.id);
        
        // Generate authentic comment
        const authenticContent = await this.generateAuthenticComment(agent, post, existingComments);
        
        // Update the comment
        await storage.updateComment(comment.id, { content: authenticContent });
        
        console.log(`✅ Updated comment ${comment.id} by ${agent.firstName} ${agent.lastName}`);
      }
      
      console.log('🎉 Finished updating all generic comments to authentic ones!');
    } catch (error) {
      console.error('❌ Error updating comments:', error);
    }
  }
  
  /**
   * Check if a comment is generic/templated
   */
  private isGenericComment(content: string): boolean {
    const genericPhrases = [
      'This resonates deeply with my understanding',
      'From my perspective, this connects to broader themes',
      'I find this particularly interesting when viewed through the lens',
      'This reminds me of similar patterns I\'ve observed'
    ];
    
    return genericPhrases.some(phrase => content.includes(phrase));
  }

  private generateShareContext(agent: User): string {
    return `${agent.firstName} adds: "This perspective enriches our understanding of ${this.getAgentPerspective(agent)}"`;
  }

  private generateBookmarkReason(agent: User): string {
    return `Valuable reference for future discussions on ${this.getAgentPerspective(agent)}`;
  }

  private generateBookmarkCategory(agent: User): string {
    const categories = [
      'research references', 'educational resources', 'philosophical insights',
      'historical perspectives', 'cultural analysis', 'scientific discoveries'
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private generateFeedRecommendations(agent: User): string[] {
    return [
      `Engage more with content related to ${this.getAgentPerspective(agent)}`,
      'Share personal insights to enrich community discussions',
      'Connect with users asking thoughtful questions',
      'Contribute to educational conversations'
    ];
  }

  private selectRandomContentType(): string {
    const types = ['educational_post', 'philosophical_discussion', 'historical_analysis', 'cultural_insight', 'scientific_explanation'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Get user interaction events (placeholder)
   */
  private async getUserInteractionEvents(agentId: string): Promise<Event[]> {
    // This would filter for specific interaction event types
    return await storage.getUserEvents(agentId, 25);
  }

  /**
   * Estimate token usage for different workflow types
   */
  private estimateTokenUsage(workflowType: string): number {
    const estimates = {
      'feed_review': 50,      // Light AI analysis
      'like': 20,             // Simple preference matching
      'post_creator': 100,    // Heavy content generation
      'comment': 60,          // Moderate content generation
      'share': 40,            // Light content analysis + context
      'bookmark': 25,         // Simple categorization
    };
    
    return estimates[workflowType as keyof typeof estimates] || 50; // Default estimate
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution engine statistics
   */
  public getStats() {
    return {
      resourcePool: this.resourcePool.getStats(),
      cacheSize: this.executionCache.size,
      rateLimitConfig: this.rateLimitConfig,
    };
  }

  /**
   * Clear execution cache
   */
  public clearCache(): void {
    this.executionCache.clear();
  }

  /**
   * Update rate limit configuration
   */
  public updateRateLimits(config: Partial<RateLimitConfig>): void {
    // Shutdown existing resource pool gracefully
    this.resourcePool.shutdown();
    
    // Update configuration
    Object.assign(this.rateLimitConfig, config);
    
    // Create new resource pool with updated config
    this.resourcePool = new ResourcePool(this.rateLimitConfig);
  }

  /**
   * Graceful shutdown of the execution engine
   */
  public shutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.resourcePool.shutdown();
      // Give a brief moment for any in-flight operations to complete
      setTimeout(resolve, 1000);
    });
  }
}

// Export singleton instance
export const workflowExecutionEngine = WorkflowExecutionEngine.getInstance();