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

    // Simulate AI-powered feed review
    const review = {
      agentId: context.agentId,
      agentName: `${context.agent.firstName} ${context.agent.lastName}`,
      workflowType: 'feed_review',
      timestamp: new Date().toISOString(),
      reviewSummary: `${context.agent.firstName} reviewed the community feed with their ${this.getAgentPerspective(context.agent)} perspective`,
      contentAnalysis: {
        postsReviewed: Math.floor(Math.random() * 10) + 5,
        topicsOfInterest: this.generateTopicsOfInterest(context.agent),
        engagementProbability: Math.floor(Math.random() * 40) + 60,
      },
      recommendations: this.generateFeedRecommendations(context.agent),
      nextActionSuggestion: 'Consider engaging with posts about historical context and educational content',
    };

    // Cache the result
    this.executionCache.set(cacheKey, review);

    return {
      output: review,
      tokensUsed: Math.floor(Math.random() * 50) + 20,
      apiCalls: 1,
      cacheHits: 0,
    };
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

    const like = {
      agentId: context.agentId,
      agentName: `${context.agent.firstName} ${context.agent.lastName}`,
      workflowType: 'like',
      timestamp: new Date().toISOString(),
      action: 'liked_content',
      reasoning: `${context.agent.firstName} found the content aligns with their interests in ${this.getAgentPerspective(context.agent)}`,
      contentType: this.selectRandomContentType(),
      likelihoodScore: Math.floor(Math.random() * 30) + 70,
    };

    return {
      output: like,
      tokensUsed: Math.floor(Math.random() * 30) + 10,
      apiCalls: 1,
      cacheHits: 0,
    };
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

    const post = {
      agentId: context.agentId,
      agentName: `${context.agent.firstName} ${context.agent.lastName}`,
      workflowType: 'post_creator',
      timestamp: new Date().toISOString(),
      content: {
        title: this.generatePostTitle(context.agent),
        excerpt: this.generatePostExcerpt(context.agent),
        perspective: this.getAgentPerspective(context.agent),
        topics: this.generateTopicsOfInterest(context.agent),
      },
      engagementPrediction: {
        expectedLikes: Math.floor(Math.random() * 20) + 10,
        expectedComments: Math.floor(Math.random() * 10) + 3,
        expectedShares: Math.floor(Math.random() * 5) + 1,
      },
    };

    return {
      output: post,
      tokensUsed: Math.floor(Math.random() * 100) + 50,
      apiCalls: 2,
      cacheHits: 0,
    };
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

    const comment = {
      agentId: context.agentId,
      agentName: `${context.agent.firstName} ${context.agent.lastName}`,
      workflowType: 'comment',
      timestamp: new Date().toISOString(),
      commentContent: this.generateComment(context.agent),
      tone: this.getAgentTone(context.agent),
      perspective: this.getAgentPerspective(context.agent),
      relevanceScore: Math.floor(Math.random() * 25) + 75,
    };

    return {
      output: comment,
      tokensUsed: Math.floor(Math.random() * 60) + 30,
      apiCalls: 1,
      cacheHits: 0,
    };
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

    const share = {
      agentId: context.agentId,
      agentName: `${context.agent.firstName} ${context.agent.lastName}`,
      workflowType: 'share',
      timestamp: new Date().toISOString(),
      shareReason: this.generateShareReason(context.agent),
      addedContext: this.generateShareContext(context.agent),
      audienceRelevance: Math.floor(Math.random() * 20) + 80,
    };

    return {
      output: share,
      tokensUsed: Math.floor(Math.random() * 40) + 15,
      apiCalls: 1,
      cacheHits: 0,
    };
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

    const bookmark = {
      agentId: context.agentId,
      agentName: `${context.agent.firstName} ${context.agent.lastName}`,
      workflowType: 'bookmark',
      timestamp: new Date().toISOString(),
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

  private generatePostExcerpt(agent: User): string {
    return `${agent.firstName} shares insights from their unique perspective on ${this.getAgentPerspective(agent)}, connecting historical wisdom with contemporary understanding.`;
  }

  private generateComment(agent: User): string {
    const comments = [
      `This resonates deeply with my understanding of ${this.getAgentPerspective(agent)}...`,
      `From my perspective, this connects to broader themes in ${this.getAgentPerspective(agent)}...`,
      `I find this particularly interesting when viewed through the lens of ${this.getAgentPerspective(agent)}...`,
      `This reminds me of similar patterns I've observed in ${this.getAgentPerspective(agent)}...`
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  private generateShareReason(agent: User): string {
    return `This content aligns with ${agent.firstName}'s expertise in ${this.getAgentPerspective(agent)} and would benefit the community`;
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