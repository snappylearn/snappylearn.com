/**
 * AutonomousOrchestrator - Core orchestration engine for autonomous AI workflows
 * 
 * This class manages the lifecycle of autonomous AI agent workflows including:
 * - Job scheduling and batch processing
 * - Agent readiness evaluation based on activity thresholds
 * - Workflow execution with concurrency control
 * - Error handling and graceful degradation
 */

import { storage } from './storage';
import { workflowExecutionEngine } from './workflow-execution-engine';
import { 
  type InsertAutonomousJob,
  type AutonomousJob,
  type InsertAutonomousAgentEvaluation,
  type InsertAutonomousWorkflowExecution,
  type User 
} from '@shared/schema';

export interface WorkflowThreshold {
  workflowType: string;
  minActivityCount: number;
  maxActivityFreshnessHours: number;
  minOnlineProbability: number;
  minOverallScore: number;
}

export interface AgentEvaluationResult {
  evaluationId: number;
  agentId: string;
  lastActivityCount: number;
  activityFreshnessHours: number;
  agentOnlineProbability: number;
  overallReadinessScore: number;
  eligibleWorkflows: WorkflowThreshold[];
}

export class AutonomousOrchestrator {
  private static instance: AutonomousOrchestrator;
  private processId: string;
  private isRunning: boolean = false;

  // Workflow configuration with intelligent thresholds
  // BOOTSTRAP MODE: Temporarily lowered thresholds to allow autonomous startup
  private readonly workflowThresholds: WorkflowThreshold[] = [
    {
      workflowType: 'feed_review',
      minActivityCount: 0,      // Lowered from 5 for bootstrap
      maxActivityFreshnessHours: 10000, // Increased to allow no-events agents (was 24)
      minOnlineProbability: 0,  // Lowered from 30 for bootstrap  
      minOverallScore: 0,       // Lowered from 40 for bootstrap
    },
    {
      workflowType: 'like',
      minActivityCount: 0,      // Lowered from 3 for bootstrap
      maxActivityFreshnessHours: 10000, // Increased to allow no-events agents (was 12)
      minOnlineProbability: 0,  // Lowered from 50 for bootstrap
      minOverallScore: 0,       // Lowered from 60 for bootstrap
    },
    {
      workflowType: 'post_creator',
      minActivityCount: 0,      // Lowered from 10 for bootstrap
      maxActivityFreshnessHours: 10000, // Increased to allow no-events agents (was 48)
      minOnlineProbability: 0,  // Lowered from 70 for bootstrap
      minOverallScore: 0,       // Lowered from 80 for bootstrap
    },
    {
      workflowType: 'comment',
      minActivityCount: 0,      // Lowered from 7 for bootstrap
      maxActivityFreshnessHours: 10000, // Increased to allow no-events agents (was 18)
      minOnlineProbability: 0,  // Lowered from 60 for bootstrap
      minOverallScore: 0,       // Lowered from 65 for bootstrap
    },
    {
      workflowType: 'share',
      minActivityCount: 0,      // Lowered from 8 for bootstrap
      maxActivityFreshnessHours: 10000, // Increased to allow no-events agents (was 36)
      minOnlineProbability: 0,  // Lowered from 65 for bootstrap
      minOverallScore: 0,       // Lowered from 70 for bootstrap
    },
    {
      workflowType: 'bookmark',
      minActivityCount: 0,      // Lowered from 4 for bootstrap
      maxActivityFreshnessHours: 10000, // Increased to allow no-events agents (was 8)
      minOnlineProbability: 0,  // Lowered from 40 for bootstrap
      minOverallScore: 0,       // Lowered from 50 for bootstrap
    },
  ];

  constructor() {
    this.processId = `orchestrator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public static getInstance(): AutonomousOrchestrator {
    if (!AutonomousOrchestrator.instance) {
      AutonomousOrchestrator.instance = new AutonomousOrchestrator();
    }
    return AutonomousOrchestrator.instance;
  }

  /**
   * Create a new autonomous job for batch processing
   */
  public async createJob(jobType: 'scheduled' | 'manual' | 'triggered' = 'scheduled', priority: number = 1): Promise<AutonomousJob> {
    const jobData: InsertAutonomousJob = {
      jobType,
      priority,
      scheduledAt: new Date(),
      metadata: {
        processId: this.processId,
        workflowThresholds: this.workflowThresholds,
      },
    };

    return await storage.createAutonomousJob(jobData);
  }

  /**
   * Execute a job with full orchestration pipeline
   */
  public async executeJob(jobId: number): Promise<boolean> {
    const lockKey = `job-execution-${jobId}`;
    const lockAcquired = await storage.acquireAutonomousExecutionLock(
      lockKey,
      this.processId,
      30 * 60 * 1000 // 30 minutes
    );

    if (!lockAcquired) {
      console.log(`Job ${jobId} is already being processed by another instance`);
      return false;
    }

    try {
      return await this.executeJobInternal(jobId);
    } finally {
      await storage.releaseAutonomousExecutionLock(lockKey, this.processId);
    }
  }

  private async executeJobInternal(jobId: number): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Mark job as running
      await storage.updateAutonomousJob(jobId, {
        status: 'running',
        startedAt: new Date(),
      });

      // Phase 1: Get all AI agents (userTypeId = 2)
      const aiAgents = await this.getActiveAIAgents();
      console.log(`Processing ${aiAgents.length} AI agents for job ${jobId}`);

      let totalAgentsProcessed = 0;
      let totalWorkflowsEvaluated = 0;
      let totalWorkflowsExecuted = 0;

      // Phase 2: Batch process agent evaluations
      for (const agent of aiAgents) {
        try {
          const evaluation = await this.evaluateAgent(jobId, agent.id);
          totalAgentsProcessed++;
          
          if (evaluation.eligibleWorkflows.length > 0) {
            totalWorkflowsEvaluated += evaluation.eligibleWorkflows.length;
            
            // Phase 3: Execute eligible workflows for this agent
            const executedCount = await this.executeAgentWorkflows(jobId, evaluation);
            totalWorkflowsExecuted += executedCount;
          }
        } catch (error) {
          console.error(`Error processing agent ${agent.id}:`, error);
          // Continue with other agents
        }
      }

      // Mark job as completed
      const executionTime = Date.now() - startTime;
      await storage.updateAutonomousJob(jobId, {
        status: 'completed',
        completedAt: new Date(),
        totalAgentsProcessed,
        totalWorkflowsEvaluated,
        totalWorkflowsExecuted,
        executionTimeMs: executionTime,
      });

      console.log(`Job ${jobId} completed successfully. Processed ${totalAgentsProcessed} agents, evaluated ${totalWorkflowsEvaluated} workflows, executed ${totalWorkflowsExecuted} workflows in ${executionTime}ms`);
      return true;

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      
      const executionTime = Date.now() - startTime;
      await storage.updateAutonomousJob(jobId, {
        status: 'failed',
        completedAt: new Date(),
        executionTimeMs: executionTime,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      
      return false;
    }
  }

  /**
   * Get all active AI agents (userTypeId = 2)
   */
  private async getActiveAIAgents(): Promise<User[]> {
    // Note: This would ideally use a dedicated method in storage, but we'll work with existing methods
    try {
      // Get all users and filter for AI agents (userTypeId = 2) that are active
      const allUsers = await storage.getPublicUsers();
      return allUsers.filter(user => user.userTypeId === 2 && user.isActive);
    } catch (error) {
      console.error('Error fetching AI agents:', error);
      return [];
    }
  }

  /**
   * Evaluate an agent's readiness for autonomous workflows
   */
  private async evaluateAgent(jobId: number, agentId: string): Promise<AgentEvaluationResult> {
    const evaluationStartTime = Date.now();

    try {
      // Get agent's recent activity from events
      const recentEvents = await storage.getUserEvents(agentId, 50);
      
      // Calculate activity metrics
      const lastActivityCount = recentEvents.length;
      const activityFreshnessHours = this.calculateActivityFreshness(recentEvents);
      const agentOnlineProbability = this.calculateOnlineProbability(recentEvents, activityFreshnessHours);
      const overallReadinessScore = this.calculateOverallReadinessScore(
        lastActivityCount,
        activityFreshnessHours,
        agentOnlineProbability
      );

      // Determine eligible workflows based on thresholds
      const eligibleWorkflows = this.workflowThresholds.filter(threshold => {
        return (
          lastActivityCount >= threshold.minActivityCount &&
          activityFreshnessHours <= threshold.maxActivityFreshnessHours &&
          agentOnlineProbability >= threshold.minOnlineProbability &&
          overallReadinessScore >= threshold.minOverallScore
        );
      });

      // Store evaluation results
      const evaluationData: InsertAutonomousAgentEvaluation = {
        jobId,
        agentId,
        evaluationStatus: 'completed',
        lastActivityCount,
        activityFreshnessHours,
        agentOnlineProbability,
        overallReadinessScore,
        workflowsEligible: eligibleWorkflows,
        evaluationTimeMs: Date.now() - evaluationStartTime,
        evaluatedAt: new Date(),
      };

      const evaluation = await storage.createAutonomousAgentEvaluation(evaluationData);

      return {
        evaluationId: evaluation.id,
        agentId,
        lastActivityCount,
        activityFreshnessHours,
        agentOnlineProbability,
        overallReadinessScore,
        eligibleWorkflows,
      };

    } catch (error) {
      console.error(`Error evaluating agent ${agentId}:`, error);
      
      // Store failed evaluation
      const evaluationData: InsertAutonomousAgentEvaluation = {
        jobId,
        agentId,
        evaluationStatus: 'error',
        lastActivityCount: 0,
        activityFreshnessHours: 0,
        agentOnlineProbability: 0,
        overallReadinessScore: 0,
        workflowsEligible: [],
        evaluationTimeMs: Date.now() - evaluationStartTime,
        evaluatedAt: new Date(),
      };

      const evaluation = await storage.createAutonomousAgentEvaluation(evaluationData);

      return {
        evaluationId: evaluation.id,
        agentId,
        lastActivityCount: 0,
        activityFreshnessHours: 0,
        agentOnlineProbability: 0,
        overallReadinessScore: 0,
        eligibleWorkflows: [],
      };
    }
  }

  /**
   * Execute eligible workflows for an agent
   */
  private async executeAgentWorkflows(jobId: number, evaluation: AgentEvaluationResult): Promise<number> {
    let executedCount = 0;

    for (const workflow of evaluation.eligibleWorkflows) {
      let execution: any = null;
      try {
        // Create workflow execution record
        const executionData: InsertAutonomousWorkflowExecution = {
          jobId,
          agentEvaluationId: evaluation.evaluationId, // Now properly linked to the evaluation
          agentId: evaluation.agentId,
          workflowType: workflow.workflowType,
          thresholdScore: evaluation.overallReadinessScore,
          inputData: {
            workflowConfig: workflow,
            agentMetrics: {
              activityCount: evaluation.lastActivityCount,
              freshnessHours: evaluation.activityFreshnessHours,
              onlineProbability: evaluation.agentOnlineProbability,
            },
          },
          startedAt: new Date(),
        };

        execution = await storage.createAutonomousWorkflowExecution(executionData);

        try {
          // Execute the actual workflow (placeholder for now)
          const result = await this.executeWorkflow(workflow.workflowType, evaluation.agentId, execution.id);

          // Update execution with results
          await storage.updateAutonomousWorkflowExecution(execution.id, {
            executionStatus: result.success ? 'completed' : 'failed',
            outputData: result.output,
            llmTokensUsed: result.tokensUsed || 0,
            executionTimeMs: result.executionTimeMs || 0,
            errorMessage: result.error,
            completedAt: new Date(),
          });

          if (result.success) {
            executedCount++;
          }
        } catch (workflowError) {
          // If workflow execution fails after creating the execution record,
          // update the record to reflect the failure
          console.error(`Workflow execution failed for ${workflow.workflowType} for agent ${evaluation.agentId}:`, workflowError);
          
          try {
            await storage.updateAutonomousWorkflowExecution(execution.id, {
              executionStatus: 'failed',
              errorMessage: workflowError instanceof Error ? workflowError.message : String(workflowError),
              completedAt: new Date(),
            });
          } catch (updateError) {
            console.error(`Failed to update execution record ${execution.id} with failure status:`, updateError);
          }
        }

      } catch (error) {
        console.error(`Error creating/executing workflow ${workflow.workflowType} for agent ${evaluation.agentId}:`, error);
        
        // If we created an execution record but failed later, try to mark it as failed
        if (execution?.id) {
          try {
            await storage.updateAutonomousWorkflowExecution(execution.id, {
              executionStatus: 'failed',
              errorMessage: error instanceof Error ? error.message : String(error),
              completedAt: new Date(),
            });
          } catch (updateError) {
            console.error(`Failed to update execution record ${execution.id} with error status:`, updateError);
          }
        }
      }
    }

    return executedCount;
  }

  /**
   * Execute a specific workflow using the WorkflowExecutionEngine
   */
  private async executeWorkflow(workflowType: string, agentId: string, executionId: number): Promise<{
    success: boolean;
    output?: any;
    tokensUsed?: number;
    executionTimeMs?: number;
    error?: string;
  }> {
    try {
      console.log(`Executing ${workflowType} workflow for agent ${agentId} (execution ${executionId})`);
      
      // Use the advanced WorkflowExecutionEngine for actual execution
      const result = await workflowExecutionEngine.executeWorkflow(
        executionId,
        agentId,
        workflowType,
        {} // inputData can be enhanced with context
      );

      return {
        success: result.success,
        output: result.output,
        tokensUsed: result.tokensUsed,
        executionTimeMs: result.executionTimeMs,
        error: result.error,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        tokensUsed: 0,
        executionTimeMs: 0,
      };
    }
  }

  /**
   * Calculate how fresh the agent's activity is (lower hours = more fresh)
   */
  private calculateActivityFreshness(events: any[]): number {
    if (events.length === 0) return 9999; // Very stale if no events

    const mostRecentEvent = events[0]; // Events are ordered by createdAt desc
    const hoursAgo = (Date.now() - new Date(mostRecentEvent.createdAt).getTime()) / (1000 * 60 * 60);
    
    return Math.floor(hoursAgo);
  }

  /**
   * Calculate agent online probability based on activity patterns
   */
  private calculateOnlineProbability(events: any[], freshnessHours: number): number {
    if (events.length === 0) return 0;

    // Base probability decreases with time
    let probability = Math.max(0, 100 - (freshnessHours * 2));

    // Boost for recent high activity
    const recentEvents = events.filter(event => {
      const hoursAgo = (Date.now() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 6;
    });

    if (recentEvents.length > 5) {
      probability += 20;
    } else if (recentEvents.length > 2) {
      probability += 10;
    }

    return Math.min(100, Math.max(0, probability));
  }

  /**
   * Calculate overall readiness score for autonomous workflow execution
   */
  private calculateOverallReadinessScore(activityCount: number, freshnessHours: number, onlineProbability: number): number {
    // Weighted scoring algorithm
    const activityScore = Math.min(100, (activityCount / 20) * 100); // Max out at 20 activities
    const freshnessScore = Math.max(0, 100 - (freshnessHours * 2)); // Decrease by 2 points per hour
    const onlineScore = onlineProbability;

    // Weighted average: 30% activity, 40% freshness, 30% online probability
    const overallScore = (activityScore * 0.3) + (freshnessScore * 0.4) + (onlineScore * 0.3);
    
    return Math.floor(Math.min(100, Math.max(0, overallScore)));
  }

  /**
   * Start automated scheduling (placeholder for future scheduling system)
   */
  public async startScheduledJobs(): Promise<void> {
    if (this.isRunning) {
      console.log('Autonomous orchestrator is already running');
      return;
    }

    this.isRunning = true;
    console.log('Autonomous orchestrator started');

    // In a real implementation, this would set up:
    // - Cron jobs for scheduled executions
    // - Event listeners for triggered executions
    // - Health monitoring and cleanup
  }

  /**
   * Stop automated scheduling
   */
  public async stopScheduledJobs(): Promise<void> {
    this.isRunning = false;
    console.log('Autonomous orchestrator stopped');
  }

  /**
   * Get orchestrator status and metrics
   */
  public async getStatus(): Promise<{
    isRunning: boolean;
    processId: string;
    pendingJobs: number;
    recentJobs: AutonomousJob[];
  }> {
    const pendingJobs = await storage.getPendingAutonomousJobs();
    const recentJobs = await storage.getAutonomousJobs(undefined, 10);

    return {
      isRunning: this.isRunning,
      processId: this.processId,
      pendingJobs: pendingJobs.length,
      recentJobs,
    };
  }

  /**
   * Clean up expired locks and old job data
   */
  public async cleanup(): Promise<void> {
    try {
      const expiredLocks = await storage.deleteExpiredAutonomousExecutionLocks();
      if (expiredLocks > 0) {
        console.log(`Cleaned up ${expiredLocks} expired execution locks`);
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const autonomousOrchestrator = AutonomousOrchestrator.getInstance();