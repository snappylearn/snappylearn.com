import nodemailer from 'nodemailer';
import { db } from '../db';
import { notifications, insertNotificationSchema, type Notification, type InsertNotification } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Notification payload types for different channels
export interface EmailPayload {
  subject: string;
  body: string;
  html?: string;
  template?: string;
  metadata?: Record<string, any>;
}

export interface SMSPayload {
  message: string;
  metadata?: Record<string, any>;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  metadata?: Record<string, any>;
}

export interface InAppPayload {
  title: string;
  body: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Provider interface - all notification providers must implement this
export interface NotificationProvider {
  send(notification: Notification): Promise<void>;
}

// Custom inbuilt email provider using Titan SMTP
export class TitanEmailProvider implements NotificationProvider {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // SECURITY: Check for environment variables but don't fail if missing during migration
    const emailUser = process.env.TITAN_EMAIL_USER;
    const emailPass = process.env.TITAN_EMAIL_PASSWORD;
    
    if (emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.titan.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
      this.isConfigured = true;
    } else {
      console.warn('TITAN_EMAIL_USER and TITAN_EMAIL_PASSWORD environment variables not set. Email notifications will be disabled.');
      this.isConfigured = false;
    }
  }

  async send(notification: Notification): Promise<void> {
    if (notification.channel !== 'email') {
      throw new Error(`TitanEmailProvider can only send email notifications, got ${notification.channel}`);
    }

    if (!this.isConfigured || !this.transporter) {
      console.warn(`Email notification ${notification.id} skipped - email service not configured`);
      return;
    }

    if (!notification.userId) {
      throw new Error('Email notifications require a user ID');
    }

    // Get user email from database
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, notification.userId!),
      columns: { email: true, firstName: true, lastName: true }
    });

    if (!user?.email) {
      throw new Error(`User ${notification.userId} not found or has no email address`);
    }

    const payload = notification.payload as EmailPayload;
    
    const mailOptions = {
      from: {
        name: 'SnappyLearn',
        address: 'hello@snappylearn.com'
      },
      to: user.email,
      subject: payload.subject,
      text: payload.body,
      html: payload.html || `<p>${payload.body}</p>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${user.email}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Placeholder providers for other channels
export class SMSProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    throw new Error('SMS provider not implemented yet');
  }
}

export class PushProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    throw new Error('Push provider not implemented yet');
  }
}

export class InAppProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    // For in-app notifications, we just mark as sent since they're stored in DB
    console.log(`In-app notification sent to user ${notification.userId}`);
  }
}

// Main notification service
export class NotificationService {
  private providers: Map<string, NotificationProvider> = new Map();

  constructor() {
    // Register providers
    this.providers.set('email', new TitanEmailProvider());
    this.providers.set('sms', new SMSProvider());
    this.providers.set('push', new PushProvider());
    this.providers.set('in_app', new InAppProvider());
  }

  // Queue a notification for sending
  async queueNotification(data: InsertNotification): Promise<Notification> {
    // Validate the data
    const validatedData = insertNotificationSchema.parse(data);
    
    // Insert into database
    const [notification] = await db
      .insert(notifications)
      .values(validatedData)
      .returning();

    console.log(`Notification ${notification.id} queued for ${notification.channel}`);
    
    // For now, send immediately (in production, this would be queued for background processing)
    this.processNotification(notification.id).catch(error => {
      console.error(`Failed to process notification ${notification.id}:`, error);
    });

    return notification;
  }

  // Process a single notification
  async processNotification(notificationId: number): Promise<void> {
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId)
    });

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    if (notification.status !== 'pending') {
      console.log(`Notification ${notificationId} already processed with status: ${notification.status}`);
      return;
    }

    const provider = this.providers.get(notification.channel);
    if (!provider) {
      await this.markAsFailed(notificationId, `No provider found for channel: ${notification.channel}`);
      return;
    }

    try {
      await provider.send(notification);
      await this.markAsSent(notificationId);
      console.log(`Notification ${notificationId} sent successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.markAsFailed(notificationId, errorMessage);
      console.error(`Failed to send notification ${notificationId}:`, errorMessage);
    }
  }

  // Mark notification as sent
  private async markAsSent(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({
        status: 'sent',
        sentAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));
  }

  // Mark notification as failed
  private async markAsFailed(notificationId: number, errorMessage: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        status: 'failed',
        errorMessage,
      })
      .where(eq(notifications.id, notificationId));
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  // Get a single notification by ID
  async getNotification(notificationId: number): Promise<Notification | null> {
    const notification = await db.query.notifications.findFirst({
      where: eq(notifications.id, notificationId)
    });
    return notification || null;
  }

  // Get notifications for a tenant
  async getTenantNotifications(tenantId: string, limit: number = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.tenantId, tenantId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  // Retry a failed notification
  async retryNotification(notificationId: number): Promise<void> {
    // Reset status to pending
    await db
      .update(notifications)
      .set({
        status: 'pending',
        errorMessage: null,
      })
      .where(eq(notifications.id, notificationId));

    // Process the notification
    await this.processNotification(notificationId);
  }

  // Send welcome email
  async sendWelcomeEmail(userId: string, tenantId?: string): Promise<Notification> {
    return await this.queueNotification({
      tenantId,
      userId,
      channel: 'email',
      payload: {
        subject: 'Welcome to SnappyLearn! 🎉',
        body: 'Thank you for joining SnappyLearn! We\'re excited to have you as part of our learning community.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">Welcome to SnappyLearn! 🎉</h1>
            <p>Thank you for joining SnappyLearn! We're excited to have you as part of our learning community.</p>
            <p>Here's what you can do to get started:</p>
            <ul>
              <li>Explore our communities and join ones that interest you</li>
              <li>Create your first collection to organize your documents</li>
              <li>Start chatting with our AI assistant to enhance your learning</li>
            </ul>
            <p>Happy learning!</p>
            <p><strong>The SnappyLearn Team</strong></p>
          </div>
        `
      },
      provider: 'custom_inbuilt'
    });
  }

  // Send community welcome email
  async sendCommunityWelcomeEmail(userId: string, communityName: string, tenantId?: string): Promise<Notification> {
    return await this.queueNotification({
      tenantId,
      userId,
      channel: 'email',
      payload: {
        subject: `Welcome to ${communityName}! 🏘️`,
        body: `You've successfully joined the ${communityName} community on SnappyLearn!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7c3aed;">Welcome to ${communityName}! 🏘️</h1>
            <p>You've successfully joined the <strong>${communityName}</strong> community on SnappyLearn!</p>
            <p>You can now:</p>
            <ul>
              <li>Participate in community discussions</li>
              <li>Share your knowledge with other members</li>
              <li>Access community-specific content and resources</li>
            </ul>
            <p>Start engaging with the community today!</p>
            <p><strong>The SnappyLearn Team</strong></p>
          </div>
        `
      },
      provider: 'custom_inbuilt'
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();