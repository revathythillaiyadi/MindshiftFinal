// N8N Webhook Integration Service
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export interface WebhookData {
  event: string;
  userId?: string;
  timestamp: string;
  data: any;
  source: 'mindshift-app';
}

export interface ChatEventData {
  message: string;
  response: string;
  mode: 'reframe' | 'journal';
  sessionId: string;
}

export interface MoodEventData {
  moodValue: number;
  moodLabel: string;
  notes?: string;
}

export interface JournalEventData {
  title: string;
  content: string;
  entryDate: string;
}

export interface GoalEventData {
  title: string;
  completed: boolean;
  action: 'created' | 'completed' | 'deleted';
}

class WebhookService {
  private webhookUrl: string | undefined;

  constructor() {
    this.webhookUrl = N8N_WEBHOOK_URL;
  }

  private async sendToWebhook(data: WebhookData): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('N8N webhook URL not configured');
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log('Data sent to n8n webhook successfully:', data.event);
        return true;
      } else {
        console.error('Failed to send data to n8n webhook:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending data to n8n webhook:', error);
      return false;
    }
  }

  // Send chat interaction data
  async sendChatEvent(eventData: ChatEventData, userId: string): Promise<boolean> {
    const webhookData: WebhookData = {
      event: 'chat_interaction',
      userId,
      timestamp: new Date().toISOString(),
      data: eventData,
      source: 'mindshift-app',
    };

    return this.sendToWebhook(webhookData);
  }

  // Send mood tracking data
  async sendMoodEvent(eventData: MoodEventData, userId: string): Promise<boolean> {
    const webhookData: WebhookData = {
      event: 'mood_logged',
      userId,
      timestamp: new Date().toISOString(),
      data: eventData,
      source: 'mindshift-app',
    };

    return this.sendToWebhook(webhookData);
  }

  // Send journal entry data
  async sendJournalEvent(eventData: JournalEventData, userId: string): Promise<boolean> {
    const webhookData: WebhookData = {
      event: 'journal_entry',
      userId,
      timestamp: new Date().toISOString(),
      data: eventData,
      source: 'mindshift-app',
    };

    return this.sendToWebhook(webhookData);
  }

  // Send goal tracking data
  async sendGoalEvent(eventData: GoalEventData, userId: string): Promise<boolean> {
    const webhookData: WebhookData = {
      event: 'goal_action',
      userId,
      timestamp: new Date().toISOString(),
      data: eventData,
      source: 'mindshift-app',
    };

    return this.sendToWebhook(webhookData);
  }

  // Send user session data
  async sendSessionEvent(sessionData: any, userId: string): Promise<boolean> {
    const webhookData: WebhookData = {
      event: 'session_created',
      userId,
      timestamp: new Date().toISOString(),
      data: sessionData,
      source: 'mindshift-app',
    };

    return this.sendToWebhook(webhookData);
  }

  // Send app usage analytics
  async sendAnalyticsEvent(analyticsData: any, userId: string): Promise<boolean> {
    const webhookData: WebhookData = {
      event: 'app_analytics',
      userId,
      timestamp: new Date().toISOString(),
      data: analyticsData,
      source: 'mindshift-app',
    };

    return this.sendToWebhook(webhookData);
  }

  // Test webhook connection
  async testConnection(): Promise<boolean> {
    const testData: WebhookData = {
      event: 'test_connection',
      timestamp: new Date().toISOString(),
      data: { message: 'Testing n8n webhook connection from Mindshift app' },
      source: 'mindshift-app',
    };

    return this.sendToWebhook(testData);
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
