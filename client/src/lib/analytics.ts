// PostHog Analytics utilities for SnappyLearn using React SDK
import posthog from 'posthog-js';

// Analytics utility class using PostHog React SDK
export class Analytics {
  static identify(userId: string, properties?: any) {
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(userId, properties);
    }
  }

  static capture(event: string, properties?: any) {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture(event, properties);
    }
  }

  static reset() {
    if (typeof window !== 'undefined' && posthog) {
      posthog.reset();
    }
  }

  static isFeatureEnabled(flag: string): boolean {
    if (typeof window !== 'undefined' && posthog) {
      return posthog.isFeatureEnabled(flag);
    }
    return false;
  }

  // User Authentication Events
  static trackSignIn(method: string, userId: string) {
    this.capture('user_signed_in', {
      method,
      user_id: userId,
    });
  }

  static trackSignUp(method: string, userId: string) {
    this.capture('user_signed_up', {
      method,
      user_id: userId,
    });
  }

  static trackSignOut() {
    this.capture('user_signed_out');
  }

  // Collection Events
  static trackCollectionCreated(collectionId: number, name: string) {
    this.capture('collection_created', {
      collection_id: collectionId,
      collection_name: name,
    });
  }

  static trackCollectionDeleted(collectionId: number, name: string) {
    this.capture('collection_deleted', {
      collection_id: collectionId,
      collection_name: name,
    });
  }

  static trackCollectionViewed(collectionId: number, name: string) {
    this.capture('collection_viewed', {
      collection_id: collectionId,
      collection_name: name,
    });
  }

  // Document Events
  static trackDocumentUploaded(documentId: number, collectionId: number, fileType: string, fileSize: number) {
    this.capture('document_uploaded', {
      document_id: documentId,
      collection_id: collectionId,
      file_type: fileType,
      file_size: fileSize,
    });
  }

  static trackDocumentDeleted(documentId: number, collectionId: number) {
    this.capture('document_deleted', {
      document_id: documentId,
      collection_id: collectionId,
    });
  }

  // Conversation Events
  static trackConversationStarted(conversationId: number, type: 'independent' | 'collection', collectionId?: number) {
    this.capture('conversation_started', {
      conversation_id: conversationId,
      conversation_type: type,
      collection_id: collectionId,
    });
  }

  static trackMessageSent(conversationId: number, messageLength: number, hasAttachments: boolean) {
    this.capture('message_sent', {
      conversation_id: conversationId,
      message_length: messageLength,
      has_attachments: hasAttachments,
    });
  }

  static trackConversationDeleted(conversationId: number, type: string) {
    this.capture('conversation_deleted', {
      conversation_id: conversationId,
      conversation_type: type,
    });
  }

  // Artifact Events
  static trackArtifactCreated(artifactId: number, type: string, title: string) {
    this.capture('artifact_created', {
      artifact_id: artifactId,
      artifact_type: type,
      artifact_title: title,
    });
  }

  static trackArtifactViewed(artifactId: number, type: string) {
    this.capture('artifact_viewed', {
      artifact_id: artifactId,
      artifact_type: type,
    });
  }

  static trackArtifactDeleted(artifactId: number, type: string) {
    this.capture('artifact_deleted', {
      artifact_id: artifactId,
      artifact_type: type,
    });
  }

  // Page Views
  static trackPageView(page: string, additionalProps?: any) {
    this.capture('page_viewed', {
      page,
      ...additionalProps,
    });
  }

  // Dashboard Events
  static trackQuickAction(action: string) {
    this.capture('quick_action_used', {
      action,
    });
  }

  static trackCollectionSelected(collectionId: number, collectionName: string) {
    this.capture('collection_selected_for_chat', {
      collection_id: collectionId,
      collection_name: collectionName,
    });
  }

  // Error Events
  static trackError(error: string, context?: any) {
    this.capture('error_occurred', {
      error_message: error,
      context,
    });
  }

  // Feature Usage
  static trackFeatureUsed(feature: string, details?: any) {
    this.capture('feature_used', {
      feature,
      ...details,
    });
  }
}