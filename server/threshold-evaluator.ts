/**
 * Advanced Threshold Evaluation System for Autonomous AI Workflows
 * 
 * This system provides sophisticated agent readiness evaluation with:
 * - Dynamic threshold adjustment based on performance history
 * - Configurable evaluation profiles for different agent types
 * - Real-time scoring with multiple evaluation dimensions
 * - Historical performance tracking and optimization
 */

import { storage } from './storage';
import type { User, Event } from '@shared/schema';

export interface ThresholdProfile {
  profileName: string;
  agentType: 'historical_figure' | 'specialist' | 'general' | 'snappy';
  baseThresholds: {
    minActivityScore: number;        // 0-100, minimum activity volume score
    maxActivityFreshnessHours: number;
    minOnlineProbability: number;
    minOverallScore: number;
  };
  weightingFactors: {
    activityWeight: number;       // 0-1, how much recent activity matters
    freshnessWeight: number;      // 0-1, how much recency matters
    consistencyWeight: number;    // 0-1, how much consistent behavior matters
    engagementWeight: number;     // 0-1, how much user engagement matters
    onlineProbabilityWeight: number; // 0-1, how much online probability matters
  };
  adaptiveSettings: {
    enableDynamicAdjustment: boolean;
    performanceWindowDays: number;
    adaptationRate: number; // 0-1, how quickly to adapt thresholds
  };
}

export interface EvaluationDimensions {
  activityVolume: number;     // 0-100, based on recent activity count
  activityFreshness: number;  // 0-100, based on how recent activity is
  behaviorConsistency: number; // 0-100, based on activity patterns
  userEngagement: number;     // 0-100, based on interactions with users
  onlineProbability: number;  // 0-100, likelihood agent is "active"
  overallReadiness: number;   // 0-100, composite score
}

export interface WorkflowReadiness {
  workflowType: string;
  isEligible: boolean;
  confidenceScore: number;  // 0-100, how confident we are in this decision
  thresholdProfile: string;
  evaluationDimensions: EvaluationDimensions;
  reasoning: string;
}

export interface WorkflowThresholds {
  minActivityScore: number;     // 0-100, minimum activity volume score
  minFreshnessScore: number;    // 0-100, minimum freshness score
  minOnlineProbability: number; // 0-100, minimum online probability
  minOverallScore: number;      // 0-100, minimum overall readiness score
}

export interface AgentEvaluationSummary {
  agentId: string;
  evaluatedAt: Date;
  thresholdProfile: ThresholdProfile;
  dimensions: EvaluationDimensions;
  workflowReadiness: WorkflowReadiness[];
  recommendedActions: string[];
  nextEvaluationRecommended: Date;
}

export class AdvancedThresholdEvaluator {
  private readonly profiles: Map<string, ThresholdProfile> = new Map();
  
  constructor() {
    this.initializeDefaultProfiles();
  }

  /**
   * Initialize default threshold profiles for different agent types
   */
  private initializeDefaultProfiles(): void {
    // Historical Figure Profile - High engagement, thoughtful responses
    this.profiles.set('historical_figure', {
      profileName: 'historical_figure',
      agentType: 'historical_figure',
      baseThresholds: {
        minActivityScore: 40,  // 0-100 score threshold
        maxActivityFreshnessHours: 24,
        minOnlineProbability: 60,
        minOverallScore: 70,
      },
      weightingFactors: {
        activityWeight: 0.20,
        freshnessWeight: 0.25,
        consistencyWeight: 0.20,
        engagementWeight: 0.15,
        onlineProbabilityWeight: 0.20,
      },
      adaptiveSettings: {
        enableDynamicAdjustment: true,
        performanceWindowDays: 7,
        adaptationRate: 0.1,
      },
    });

    // Specialist Profile - Domain expertise, precise responses
    this.profiles.set('specialist', {
      profileName: 'specialist',
      agentType: 'specialist',
      baseThresholds: {
        minActivityScore: 30,  // 0-100 score threshold
        maxActivityFreshnessHours: 18,
        minOnlineProbability: 65,
        minOverallScore: 75,
      },
      weightingFactors: {
        activityWeight: 0.25,
        freshnessWeight: 0.30,
        consistencyWeight: 0.15,
        engagementWeight: 0.10,
        onlineProbabilityWeight: 0.20,
      },
      adaptiveSettings: {
        enableDynamicAdjustment: true,
        performanceWindowDays: 5,
        adaptationRate: 0.15,
      },
    });

    // General Agent Profile - Broad conversations, flexible
    this.profiles.set('general', {
      profileName: 'general',
      agentType: 'general',
      baseThresholds: {
        minActivityScore: 20,  // 0-100 score threshold
        maxActivityFreshnessHours: 12,
        minOnlineProbability: 50,
        minOverallScore: 60,
      },
      weightingFactors: {
        activityWeight: 0.30,
        freshnessWeight: 0.20,
        consistencyWeight: 0.10,
        engagementWeight: 0.20,
        onlineProbabilityWeight: 0.20,
      },
      adaptiveSettings: {
        enableDynamicAdjustment: true,
        performanceWindowDays: 3,
        adaptationRate: 0.2,
      },
    });

    // Snappy Agent Profile - Always ready, high availability
    this.profiles.set('snappy', {
      profileName: 'snappy',
      agentType: 'snappy',
      baseThresholds: {
        minActivityScore: 10,  // 0-100 score threshold
        maxActivityFreshnessHours: 6,
        minOnlineProbability: 90,
        minOverallScore: 85,
      },
      weightingFactors: {
        activityWeight: 0.15,
        freshnessWeight: 0.35,
        consistencyWeight: 0.05,
        engagementWeight: 0.25,
        onlineProbabilityWeight: 0.20,
      },
      adaptiveSettings: {
        enableDynamicAdjustment: false, // Snappy should be consistent
        performanceWindowDays: 1,
        adaptationRate: 0.05,
      },
    });
  }

  /**
   * Evaluate an agent's readiness across all dimensions
   */
  public async evaluateAgent(agentId: string, profileName: string = 'historical_figure'): Promise<AgentEvaluationSummary> {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      throw new Error(`Unknown threshold profile: ${profileName}`);
    }

    // Gather agent data
    const [agent, recentEvents, userInteractions] = await Promise.all([
      storage.getUser(agentId),
      storage.getUserEvents(agentId, 100),
      this.getUserInteractionEvents(agentId),
    ]);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Calculate evaluation dimensions
    const dimensions = await this.calculateEvaluationDimensions(
      recentEvents,
      userInteractions,
      profile
    );

    // Evaluate workflow readiness
    const workflowReadiness = this.evaluateWorkflowReadiness(dimensions, profile);

    // Generate recommendations
    const recommendedActions = this.generateRecommendations(dimensions, workflowReadiness);

    // Calculate next evaluation time
    const nextEvaluationRecommended = this.calculateNextEvaluationTime(dimensions, profile);

    return {
      agentId,
      evaluatedAt: new Date(),
      thresholdProfile: profile,
      dimensions,
      workflowReadiness,
      recommendedActions,
      nextEvaluationRecommended,
    };
  }

  /**
   * Calculate comprehensive evaluation dimensions
   */
  private async calculateEvaluationDimensions(
    events: Event[],
    interactions: Event[],
    profile: ThresholdProfile
  ): Promise<EvaluationDimensions> {
    // Activity Volume (0-100)
    const activityVolume = this.calculateActivityVolume(events);
    
    // Activity Freshness (0-100)
    const activityFreshness = this.calculateActivityFreshness(events);
    
    // Behavior Consistency (0-100)
    const behaviorConsistency = this.calculateBehaviorConsistency(events);
    
    // User Engagement (0-100)
    const userEngagement = this.calculateUserEngagement(interactions);
    
    // Online Probability (0-100)
    const onlineProbability = this.calculateOnlineProbability(events, activityFreshness);
    
    // Overall Readiness (weighted composite score)
    const overallReadiness = this.calculateOverallReadiness(
      activityVolume,
      activityFreshness,
      behaviorConsistency,
      userEngagement,
      onlineProbability,
      profile
    );

    return {
      activityVolume,
      activityFreshness,
      behaviorConsistency,
      userEngagement,
      onlineProbability,
      overallReadiness,
    };
  }

  /**
   * Calculate activity volume score based on recent events
   */
  private calculateActivityVolume(events: Event[]): number {
    const recentEvents = events.filter(event => {
      const hoursAgo = (Date.now() - new Date(event.createdAt!).getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24; // Last 24 hours
    });

    // Score based on event count with diminishing returns
    const score = Math.min(100, (recentEvents.length / 20) * 100);
    return Math.floor(score);
  }

  /**
   * Calculate activity freshness score (higher = more recent activity)
   */
  private calculateActivityFreshness(events: Event[]): number {
    if (events.length === 0) return 0;

    // Sort events by createdAt desc to ensure most recent is first
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );

    const mostRecentEvent = sortedEvents[0];
    const hoursAgo = (Date.now() - new Date(mostRecentEvent.createdAt!).getTime()) / (1000 * 60 * 60);
    
    // Exponential decay: 100% for immediate, 50% at 6 hours, 0% at 48 hours
    const score = Math.max(0, 100 * Math.exp(-hoursAgo / 12));
    return Math.floor(score);
  }

  /**
   * Calculate behavior consistency score based on activity patterns
   */
  private calculateBehaviorConsistency(events: Event[]): number {
    if (events.length < 5) return 30; // Insufficient data for consistency

    // Group events by hour of day and day of week
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);

    events.forEach(event => {
      const date = new Date(event.createdAt!);
      hourlyActivity[date.getHours()]++;
      dailyActivity[date.getDay()]++;
    });

    // Calculate coefficient of variation (lower = more consistent)
    const hourlyCV = this.coefficientOfVariation(hourlyActivity);
    const dailyCV = this.coefficientOfVariation(dailyActivity);

    // Convert to consistency score (0-100, higher = more consistent)
    const hourlyConsistency = Math.max(0, 100 - (hourlyCV * 50));
    const dailyConsistency = Math.max(0, 100 - (dailyCV * 50));

    return Math.floor((hourlyConsistency + dailyConsistency) / 2);
  }

  /**
   * Calculate user engagement score based on interaction events
   */
  private calculateUserEngagement(interactions: Event[]): number {
    if (interactions.length === 0) return 20; // Base score for new agents

    const recentInteractions = interactions.filter(event => {
      const hoursAgo = (Date.now() - new Date(event.createdAt!).getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 72; // Last 3 days
    });

    // Score based on interaction frequency and recency
    const baseScore = Math.min(80, (recentInteractions.length / 10) * 80);
    
    // Bonus for very recent interactions
    const veryRecentInteractions = recentInteractions.filter(event => {
      const hoursAgo = (Date.now() - new Date(event.createdAt!).getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 6;
    });

    const recencyBonus = Math.min(20, veryRecentInteractions.length * 5);
    return Math.floor(baseScore + recencyBonus);
  }

  /**
   * Calculate online probability based on activity patterns
   */
  private calculateOnlineProbability(events: Event[], freshnessScore: number): number {
    // Base probability from freshness
    let probability = freshnessScore * 0.7;

    // Activity pattern analysis
    const recentEvents = events.filter(event => {
      const hoursAgo = (Date.now() - new Date(event.createdAt!).getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 6;
    });

    // Boost for burst activity (sign of active engagement)
    if (recentEvents.length > 3) {
      probability += 15;
    } else if (recentEvents.length > 1) {
      probability += 8;
    }

    // Check for sustained activity
    const sustainedActivity = events.filter(event => {
      const hoursAgo = (Date.now() - new Date(event.createdAt!).getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 2;
    }).length;

    if (sustainedActivity > 0) {
      probability += 15;
    }

    return Math.floor(Math.min(100, Math.max(0, probability)));
  }

  /**
   * Calculate overall readiness using weighted factors
   */
  private calculateOverallReadiness(
    activityVolume: number,
    activityFreshness: number,
    behaviorConsistency: number,
    userEngagement: number,
    onlineProbability: number,
    profile: ThresholdProfile
  ): number {
    const weights = profile.weightingFactors;
    
    const score = 
      (activityVolume * weights.activityWeight) +
      (activityFreshness * weights.freshnessWeight) +
      (behaviorConsistency * weights.consistencyWeight) +
      (userEngagement * weights.engagementWeight) +
      (onlineProbability * weights.onlineProbabilityWeight);

    return Math.floor(Math.min(100, Math.max(0, score)));
  }

  /**
   * Evaluate readiness for specific workflows
   */
  private evaluateWorkflowReadiness(
    dimensions: EvaluationDimensions,
    profile: ThresholdProfile
  ): WorkflowReadiness[] {
    const workflowTypes = [
      'feed_review',
      'like',
      'post_creator',
      'comment',
      'share',
      'bookmark'
    ];

    return workflowTypes.map(workflowType => {
      const { isEligible, confidenceScore, reasoning } = this.evaluateWorkflowType(
        workflowType,
        dimensions,
        profile
      );

      return {
        workflowType,
        isEligible,
        confidenceScore,
        thresholdProfile: profile.profileName,
        evaluationDimensions: dimensions,
        reasoning,
      };
    });
  }

  /**
   * Evaluate readiness for a specific workflow type
   */
  private evaluateWorkflowType(
    workflowType: string,
    dimensions: EvaluationDimensions,
    profile: ThresholdProfile
  ): { isEligible: boolean; confidenceScore: number; reasoning: string } {
    const thresholds = this.getWorkflowSpecificThresholds(workflowType, profile);
    
    // Check base requirements
    const meetsMinimums = 
      dimensions.activityVolume >= thresholds.minActivityScore &&
      dimensions.activityFreshness >= thresholds.minFreshnessScore &&
      dimensions.onlineProbability >= thresholds.minOnlineProbability &&
      dimensions.overallReadiness >= thresholds.minOverallScore;

    // Calculate confidence based on how much we exceed thresholds
    let confidenceScore = 50; // Base confidence

    if (meetsMinimums) {
      const activityExcess = (dimensions.activityVolume - thresholds.minActivityScore) / 20;
      const freshnessExcess = (dimensions.activityFreshness - thresholds.minFreshnessScore) / 20;
      const onlineExcess = (dimensions.onlineProbability - thresholds.minOnlineProbability) / 20;
      const overallExcess = (dimensions.overallReadiness - thresholds.minOverallScore) / 20;

      confidenceScore += (activityExcess + freshnessExcess + onlineExcess + overallExcess) * 5;
    }

    confidenceScore = Math.min(100, Math.max(0, confidenceScore));

    // Generate reasoning
    const reasoning = this.generateWorkflowReasoning(workflowType, dimensions, thresholds, meetsMinimums);

    return {
      isEligible: meetsMinimums,
      confidenceScore: Math.floor(confidenceScore),
      reasoning,
    };
  }

  /**
   * Get workflow-specific thresholds
   */
  private getWorkflowSpecificThresholds(workflowType: string, profile: ThresholdProfile): WorkflowThresholds {
    const base = profile.baseThresholds;
    
    // Adjust thresholds based on workflow complexity and risk
    switch (workflowType) {
      case 'feed_review':
        return {
          minActivityScore: Math.max(15, base.minActivityScore * 0.75), // Lower requirement for passive activity
          minFreshnessScore: 60,
          minOnlineProbability: base.minOnlineProbability * 0.6,
          minOverallScore: base.minOverallScore * 0.6,
        };
      case 'like':
        return {
          minActivityScore: Math.max(10, base.minActivityScore * 0.5), // Very low requirement for simple actions
          minFreshnessScore: 70,
          minOnlineProbability: base.minOnlineProbability * 0.8,
          minOverallScore: base.minOverallScore * 0.7,
        };
      case 'post_creator':
        return {
          minActivityScore: Math.max(25, base.minActivityScore * 1.25), // Higher requirement for content creation
          minFreshnessScore: 50,
          minOnlineProbability: base.minOnlineProbability,
          minOverallScore: base.minOverallScore,
        };
      case 'comment':
        return {
          minActivityScore: Math.max(20, base.minActivityScore), // Standard requirement for interaction
          minFreshnessScore: 65,
          minOnlineProbability: base.minOnlineProbability * 0.9,
          minOverallScore: base.minOverallScore * 0.8,
        };
      case 'share':
        return {
          minActivityScore: Math.max(20, base.minActivityScore), // Standard requirement for sharing
          minFreshnessScore: 55,
          minOnlineProbability: base.minOnlineProbability * 0.85,
          minOverallScore: base.minOverallScore * 0.85,
        };
      case 'bookmark':
        return {
          minActivityScore: Math.max(10, base.minActivityScore * 0.5), // Low requirement for personal actions
          minFreshnessScore: 80,
          minOnlineProbability: base.minOnlineProbability * 0.7,
          minOverallScore: base.minOverallScore * 0.6,
        };
      default:
        return {
          minActivityScore: base.minActivityScore,
          minFreshnessScore: 60,
          minOnlineProbability: base.minOnlineProbability,
          minOverallScore: base.minOverallScore,
        };
    }
  }

  /**
   * Generate human-readable reasoning for workflow decisions
   */
  private generateWorkflowReasoning(
    workflowType: string,
    dimensions: EvaluationDimensions,
    thresholds: WorkflowThresholds,
    meetsMinimums: boolean
  ): string {
    if (!meetsMinimums) {
      const failedCriteria = [];
      if (dimensions.activityVolume < thresholds.minActivityScore) {
        failedCriteria.push('insufficient recent activity');
      }
      if (dimensions.activityFreshness < thresholds.minFreshnessScore) {
        failedCriteria.push('activity not recent enough');
      }
      if (dimensions.onlineProbability < thresholds.minOnlineProbability) {
        failedCriteria.push('low online probability');
      }
      if (dimensions.overallReadiness < thresholds.minOverallScore) {
        failedCriteria.push('overall readiness score too low');
      }
      
      return `Not eligible for ${workflowType}: ${failedCriteria.join(', ')}`;
    }

    const strengths = [];
    if (dimensions.activityVolume > thresholds.minActivityScore + 20) {
      strengths.push('high activity volume');
    }
    if (dimensions.activityFreshness > thresholds.minFreshnessScore + 20) {
      strengths.push('very recent activity');
    }
    if (dimensions.onlineProbability > thresholds.minOnlineProbability + 20) {
      strengths.push('high availability');
    }
    if (dimensions.behaviorConsistency > 70) {
      strengths.push('consistent behavior patterns');
    }

    if (strengths.length > 0) {
      return `Eligible for ${workflowType} with ${strengths.join(', ')}`;
    }

    return `Eligible for ${workflowType} - meets minimum requirements`;
  }

  /**
   * Generate actionable recommendations based on evaluation
   */
  private generateRecommendations(
    dimensions: EvaluationDimensions,
    workflowReadiness: WorkflowReadiness[]
  ): string[] {
    const recommendations: string[] = [];

    // Activity-based recommendations
    if (dimensions.activityVolume < 30) {
      recommendations.push('Increase activity frequency to improve workflow eligibility');
    }

    if (dimensions.activityFreshness < 40) {
      recommendations.push('Agent needs more recent activity to maintain readiness');
    }

    if (dimensions.behaviorConsistency < 50) {
      recommendations.push('Establish more consistent activity patterns for better predictability');
    }

    if (dimensions.userEngagement < 40) {
      recommendations.push('Focus on user interaction workflows to improve engagement metrics');
    }

    // Workflow-specific recommendations
    const eligibleWorkflows = workflowReadiness.filter(w => w.isEligible);
    const lowConfidenceWorkflows = eligibleWorkflows.filter(w => w.confidenceScore < 70);

    if (eligibleWorkflows.length === 0) {
      recommendations.push('No workflows currently eligible - focus on increasing overall activity');
    } else if (lowConfidenceWorkflows.length > 0) {
      recommendations.push(`Monitor execution of ${lowConfidenceWorkflows.map(w => w.workflowType).join(', ')} workflows closely`);
    }

    if (dimensions.overallReadiness > 80) {
      recommendations.push('Agent is highly ready - consider increasing workflow frequency');
    }

    return recommendations;
  }

  /**
   * Calculate when the next evaluation should occur
   */
  private calculateNextEvaluationTime(
    dimensions: EvaluationDimensions,
    profile: ThresholdProfile
  ): Date {
    let hoursUntilNext = 24; // Default 24 hours

    // Adjust based on readiness level
    if (dimensions.overallReadiness > 80) {
      hoursUntilNext = 12; // More frequent for highly ready agents
    } else if (dimensions.overallReadiness < 40) {
      hoursUntilNext = 6; // Very frequent for struggling agents
    }

    // Adjust based on activity freshness
    if (dimensions.activityFreshness < 30) {
      hoursUntilNext = Math.min(hoursUntilNext, 4); // Check soon if activity is stale
    }

    return new Date(Date.now() + (hoursUntilNext * 60 * 60 * 1000));
  }

  /**
   * Get user interaction events (placeholder - would need specific event types)
   */
  private async getUserInteractionEvents(agentId: string): Promise<Event[]> {
    // This would filter for specific interaction event types
    // For now, return all events as a placeholder
    return await storage.getUserEvents(agentId, 50);
  }

  /**
   * Calculate coefficient of variation for consistency measurement
   */
  private coefficientOfVariation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean;
  }

  /**
   * Get all available threshold profiles
   */
  public getAvailableProfiles(): ThresholdProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Add or update a threshold profile
   */
  public setProfile(profile: ThresholdProfile): void {
    this.profiles.set(profile.profileName, profile);
  }

  /**
   * Get a specific threshold profile
   */
  public getProfile(profileName: string): ThresholdProfile | undefined {
    return this.profiles.get(profileName);
  }
}

// Export singleton instance
export const thresholdEvaluator = new AdvancedThresholdEvaluator();