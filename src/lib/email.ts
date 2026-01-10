/**
 * Email Client
 * Resend integration for transactional and marketing emails
 */

import { Resend } from 'resend';
import { features } from './env';
import { logger } from './monitoring';

// ============================================
// Types
// ============================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[] | string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  tags?: Array<{ name: string; value: string }>;
  scheduledAt?: Date;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface BulkEmailResult {
  success: boolean;
  results: Array<{
    to: string;
    id?: string;
    error?: string;
  }>;
}

// ============================================
// Configuration
// ============================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Inner Circle <notifications@innercircle.co>';
const DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@innercircle.co';

// Check if email is configured
export const isEmailConfigured = Boolean(RESEND_API_KEY);

// ============================================
// Email Client
// ============================================

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) {
    return null;
  }
  
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  
  return resendClient;
}

// ============================================
// Email Functions
// ============================================

/**
 * Send a single email
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const client = getResendClient();
  
  // If not configured, log and return mock success
  if (!client) {
    logger.info('[Email] Simulated send (Resend not configured)', {
      to: options.to,
      subject: options.subject,
    });
    
    return {
      success: true,
      id: `mock-${Date.now()}`,
    };
  }
  
  try {
    // Normalize recipients
    const to = normalizeRecipients(options.to);
    
    const { data, error } = await client.emails.send({
      from: options.from || DEFAULT_FROM,
      to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      react: options.react,
      replyTo: options.replyTo || DEFAULT_REPLY_TO,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
      tags: options.tags,
      scheduledAt: options.scheduledAt?.toISOString(),
    });
    
    if (error) {
      logger.error('[Email] Send failed', error, { to, subject: options.subject });
      return {
        success: false,
        error: error.message,
      };
    }
    
    logger.info('[Email] Sent successfully', { id: data?.id, to, subject: options.subject });
    
    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Email] Exception during send', error, { to: options.to, subject: options.subject });
    
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Send bulk emails (up to 100 at a time)
 */
export async function sendBulkEmails(
  emails: Array<Omit<SendEmailOptions, 'scheduledAt'>>
): Promise<BulkEmailResult> {
  const client = getResendClient();
  
  if (!client) {
    logger.info('[Email] Simulated bulk send (Resend not configured)', {
      count: emails.length,
    });
    
    return {
      success: true,
      results: emails.map(e => ({
        to: normalizeRecipients(e.to)[0] || 'unknown',
        id: `mock-${Date.now()}`,
      })),
    };
  }
  
  try {
    const { data, error } = await client.batch.send(
      emails.map(email => ({
        from: email.from || DEFAULT_FROM,
        to: normalizeRecipients(email.to),
        subject: email.subject,
        html: email.html,
        text: email.text,
        react: email.react,
        replyTo: email.replyTo || DEFAULT_REPLY_TO,
        tags: email.tags,
      }))
    );
    
    if (error) {
      logger.error('[Email] Bulk send failed', error);
      return {
        success: false,
        results: emails.map(e => ({
          to: normalizeRecipients(e.to)[0] || 'unknown',
          error: error.message,
        })),
      };
    }
    
    logger.info('[Email] Bulk send completed', { count: data?.data?.length });
    
    return {
      success: true,
      results: data?.data?.map((result, i) => ({
        to: normalizeRecipients(emails[i]?.to || '')[0] || 'unknown',
        id: result.id,
      })) || [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Email] Exception during bulk send', error);
    
    return {
      success: false,
      results: emails.map(e => ({
        to: normalizeRecipients(e.to)[0] || 'unknown',
        error: message,
      })),
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize recipients to string array
 */
function normalizeRecipients(
  to: EmailRecipient | EmailRecipient[] | string | string[]
): string[] {
  if (typeof to === 'string') {
    return [to];
  }
  
  if (Array.isArray(to)) {
    return to.map(r => {
      if (typeof r === 'string') return r;
      return r.name ? `${r.name} <${r.email}>` : r.email;
    });
  }
  
  return [to.name ? `${to.name} <${to.email}>` : to.email];
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email sending is available
 */
export function canSendEmails(): boolean {
  return features.hasEmail || isEmailConfigured;
}

// ============================================
// Email Health Check
// ============================================

export async function checkEmailHealth(): Promise<{
  configured: boolean;
  operational: boolean;
  error?: string;
}> {
  if (!isEmailConfigured) {
    return {
      configured: false,
      operational: false,
      error: 'Resend API key not configured',
    };
  }
  
  // In a real implementation, you might ping the Resend API
  // For now, we just check if the key is present
  return {
    configured: true,
    operational: true,
  };
}
