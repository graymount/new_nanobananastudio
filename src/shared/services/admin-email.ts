import { nanoid } from 'nanoid';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { email } from '@/config/db/schema';

import { getEmailService } from './email';

// Types
export type EmailDirection = 'inbound' | 'outbound';
export type EmailStatus = 'received' | 'pending' | 'sent' | 'failed';

export interface EmailAttachment {
  filename: string;
  url: string;
  contentType: string;
  size: number;
}

export interface Email {
  id: string;
  messageId: string | null;
  threadId: string | null;
  direction: EmailDirection;
  fromEmail: string;
  fromName: string | null;
  toEmail: string;
  toName: string | null;
  cc: string | null;
  bcc: string | null;
  subject: string;
  textContent: string | null;
  htmlContent: string | null;
  attachments: EmailAttachment[] | null;
  status: EmailStatus;
  parentId: string | null;
  replyToMessageId: string | null;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailQueryOptions {
  direction?: EmailDirection;
  status?: EmailStatus;
  isRead?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InboundEmailData {
  messageId?: string;
  fromEmail: string;
  fromName?: string;
  toEmail: string;
  toName?: string;
  cc?: string;
  subject: string;
  textContent?: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  metadata?: Record<string, unknown>;
}

export interface ReplyEmailData {
  parentId: string;
  textContent?: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  fromEmail?: string;
}

export interface NewEmailData {
  toEmail: string;
  toName?: string;
  cc?: string;
  bcc?: string;
  subject: string;
  textContent?: string;
  htmlContent?: string;
  attachments?: EmailAttachment[];
  fromEmail?: string;
}

// Email sender addresses
export const EMAIL_SENDERS = {
  support: {
    email: 'support@nanobananastudio.com',
    name: 'Nano Banana Studio Support',
    from: 'Nano Banana Studio <support@nanobananastudio.com>',
  },
  ceo: {
    email: 'ceo@nanobananastudio.com',
    name: 'Alex King - CEO',
    from: 'Alex King, CEO of Nano Banana Studio <ceo@nanobananastudio.com>',
  },
} as const;

export type SenderType = keyof typeof EMAIL_SENDERS;

/**
 * Get sender config by email address
 */
function getSenderByEmail(emailAddress: string) {
  for (const [key, sender] of Object.entries(EMAIL_SENDERS)) {
    if (sender.email === emailAddress) {
      return sender;
    }
  }
  return EMAIL_SENDERS.support;
}

/**
 * Parse attachments from JSON string
 */
function parseAttachments(attachmentsJson: string | null): EmailAttachment[] | null {
  if (!attachmentsJson) return null;
  try {
    return JSON.parse(attachmentsJson);
  } catch {
    return null;
  }
}

/**
 * Parse metadata from JSON string
 */
function parseMetadata(metadataJson: string | null): Record<string, unknown> | null {
  if (!metadataJson) return null;
  try {
    return JSON.parse(metadataJson);
  } catch {
    return null;
  }
}

/**
 * Convert database row to Email type
 */
function rowToEmail(row: typeof email.$inferSelect): Email {
  return {
    id: row.id,
    messageId: row.messageId,
    threadId: row.threadId,
    direction: row.direction as EmailDirection,
    fromEmail: row.fromEmail,
    fromName: row.fromName,
    toEmail: row.toEmail,
    toName: row.toName,
    cc: row.cc,
    bcc: row.bcc,
    subject: row.subject,
    textContent: row.textContent,
    htmlContent: row.htmlContent,
    attachments: parseAttachments(row.attachments),
    status: row.status as EmailStatus,
    parentId: row.parentId,
    replyToMessageId: row.replyToMessageId,
    isRead: row.isRead,
    metadata: parseMetadata(row.metadata),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Get emails with pagination and filtering
 */
export async function getEmails(options: EmailQueryOptions = {}): Promise<{
  emails: Email[];
  total: number;
}> {
  const { direction, status, isRead, search, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (direction) {
    conditions.push(eq(email.direction, direction));
  }

  if (status) {
    conditions.push(eq(email.status, status));
  }

  if (isRead !== undefined) {
    conditions.push(eq(email.isRead, isRead));
  }

  if (search) {
    conditions.push(
      or(
        ilike(email.subject, `%${search}%`),
        ilike(email.fromEmail, `%${search}%`),
        ilike(email.toEmail, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [emails, countResult] = await Promise.all([
    db()
      .select()
      .from(email)
      .where(whereClause)
      .orderBy(desc(email.createdAt))
      .limit(limit)
      .offset(offset),
    db()
      .select({ count: sql<number>`count(*)` })
      .from(email)
      .where(whereClause),
  ]);

  return {
    emails: emails.map(rowToEmail),
    total: Number(countResult[0]?.count || 0),
  };
}

/**
 * Get email by ID
 */
export async function getEmailById(id: string): Promise<Email | null> {
  const result = await db().select().from(email).where(eq(email.id, id));
  return result[0] ? rowToEmail(result[0]) : null;
}

/**
 * Get email thread by thread ID
 */
export async function getEmailThread(threadId: string): Promise<Email[]> {
  const result = await db()
    .select()
    .from(email)
    .where(eq(email.threadId, threadId))
    .orderBy(email.createdAt);
  return result.map(rowToEmail);
}

/**
 * Create inbound email (from Cloudflare webhook)
 */
export async function createInboundEmail(
  data: InboundEmailData
): Promise<Email> {
  const id = nanoid();
  const threadId = data.messageId || id;

  const [result] = await db()
    .insert(email)
    .values({
      id,
      messageId: data.messageId || null,
      threadId,
      direction: 'inbound',
      fromEmail: data.fromEmail,
      fromName: data.fromName || null,
      toEmail: data.toEmail,
      toName: data.toName || null,
      cc: data.cc || null,
      bcc: null,
      subject: data.subject,
      textContent: data.textContent || null,
      htmlContent: data.htmlContent || null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      status: 'received',
      parentId: null,
      replyToMessageId: null,
      isRead: false,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    })
    .returning();

  return rowToEmail(result);
}

/**
 * Send reply email
 */
export async function sendReplyEmail(
  data: ReplyEmailData
): Promise<{ success: boolean; email?: Email; error?: string }> {
  const parentEmail = await getEmailById(data.parentId);
  if (!parentEmail) {
    return { success: false, error: 'Parent email not found' };
  }

  const toEmail =
    parentEmail.direction === 'inbound'
      ? parentEmail.fromEmail
      : parentEmail.toEmail;
  const toName =
    parentEmail.direction === 'inbound'
      ? parentEmail.fromName
      : parentEmail.toName;

  const originalRecipient = parentEmail.direction === 'inbound'
    ? parentEmail.toEmail
    : parentEmail.fromEmail;
  const sender = data.fromEmail
    ? getSenderByEmail(data.fromEmail)
    : getSenderByEmail(originalRecipient);

  const subject = parentEmail.subject.startsWith('Re:')
    ? parentEmail.subject
    : `Re: ${parentEmail.subject}`;

  const id = nanoid();
  const [outboundEmail] = await db()
    .insert(email)
    .values({
      id,
      messageId: null,
      threadId: parentEmail.threadId,
      direction: 'outbound',
      fromEmail: sender.email,
      fromName: sender.name,
      toEmail,
      toName,
      cc: null,
      bcc: null,
      subject,
      textContent: data.textContent || null,
      htmlContent: data.htmlContent || null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      status: 'pending',
      parentId: data.parentId,
      replyToMessageId: parentEmail.messageId,
      isRead: true,
      metadata: null,
    })
    .returning();

  try {
    const emailService = await getEmailService();

    const emailContent: {
      to: string;
      from: string;
      subject: string;
      text?: string;
      html?: string;
      replyTo?: string;
      headers?: Record<string, string>;
    } = {
      to: toEmail,
      from: sender.from,
      subject,
      replyTo: sender.email,
    };

    if (data.textContent) {
      emailContent.text = data.textContent;
    }

    if (data.htmlContent) {
      emailContent.html = data.htmlContent;
    }

    if (parentEmail.messageId) {
      emailContent.headers = {
        'In-Reply-To': parentEmail.messageId,
        References: parentEmail.messageId,
      };
    }

    const result = await emailService.sendEmail(emailContent);

    if (result.success) {
      await db()
        .update(email)
        .set({
          status: 'sent',
          messageId: result.messageId || null,
        })
        .where(eq(email.id, id));

      return {
        success: true,
        email: rowToEmail({ ...outboundEmail, status: 'sent' }),
      };
    } else {
      await db()
        .update(email)
        .set({
          status: 'failed',
          metadata: JSON.stringify({ error: result.error }),
        })
        .where(eq(email.id, id));

      return { success: false, error: result.error };
    }
  } catch (error) {
    await db()
      .update(email)
      .set({
        status: 'failed',
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      })
      .where(eq(email.id, id));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send new email (not a reply)
 */
export async function sendNewEmail(
  data: NewEmailData
): Promise<{ success: boolean; email?: Email; error?: string }> {
  const sender = data.fromEmail
    ? getSenderByEmail(data.fromEmail)
    : EMAIL_SENDERS.support;

  const id = nanoid();
  const threadId = nanoid();

  const [outboundEmail] = await db()
    .insert(email)
    .values({
      id,
      messageId: null,
      threadId,
      direction: 'outbound',
      fromEmail: sender.email,
      fromName: sender.name,
      toEmail: data.toEmail,
      toName: data.toName || null,
      cc: data.cc || null,
      bcc: data.bcc || null,
      subject: data.subject,
      textContent: data.textContent || null,
      htmlContent: data.htmlContent || null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      status: 'pending',
      parentId: null,
      replyToMessageId: null,
      isRead: true,
      metadata: null,
    })
    .returning();

  try {
    const emailService = await getEmailService();

    const emailContent: {
      to: string;
      from: string;
      subject: string;
      text?: string;
      html?: string;
      replyTo?: string;
      cc?: string;
      bcc?: string;
    } = {
      to: data.toEmail,
      from: sender.from,
      subject: data.subject,
      replyTo: sender.email,
    };

    if (data.textContent) {
      emailContent.text = data.textContent;
    }

    if (data.htmlContent) {
      emailContent.html = data.htmlContent;
    }

    if (data.cc) {
      emailContent.cc = data.cc;
    }

    if (data.bcc) {
      emailContent.bcc = data.bcc;
    }

    const result = await emailService.sendEmail(emailContent);

    if (result.success) {
      await db()
        .update(email)
        .set({
          status: 'sent',
          messageId: result.messageId || null,
        })
        .where(eq(email.id, id));

      return {
        success: true,
        email: rowToEmail({ ...outboundEmail, status: 'sent' }),
      };
    } else {
      await db()
        .update(email)
        .set({
          status: 'failed',
          metadata: JSON.stringify({ error: result.error }),
        })
        .where(eq(email.id, id));

      return { success: false, error: result.error };
    }
  } catch (error) {
    await db()
      .update(email)
      .set({
        status: 'failed',
        metadata: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      })
      .where(eq(email.id, id));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark email as read
 */
export async function markEmailAsRead(id: string): Promise<boolean> {
  await db()
    .update(email)
    .set({ isRead: true })
    .where(eq(email.id, id));
  return true;
}

/**
 * Mark email as unread
 */
export async function markEmailAsUnread(id: string): Promise<boolean> {
  await db()
    .update(email)
    .set({ isRead: false })
    .where(eq(email.id, id));
  return true;
}

/**
 * Get unread email count
 */
export async function getUnreadCount(): Promise<number> {
  const result = await db()
    .select({ count: sql<number>`count(*)` })
    .from(email)
    .where(and(eq(email.direction, 'inbound'), eq(email.isRead, false)));
  return Number(result[0]?.count || 0);
}

/**
 * Delete email by ID
 */
export async function deleteEmail(id: string): Promise<boolean> {
  await db().delete(email).where(eq(email.id, id));
  return true;
}

// Broadcast email types
export interface BroadcastEmailData {
  subject: string;
  textContent?: string;
  htmlContent?: string;
  fromEmail?: string;
}

export interface BroadcastResult {
  success: boolean;
  totalUsers: number;
  sentCount: number;
  failedCount: number;
  errors: Array<{ email: string; error: string }>;
}

/**
 * Send broadcast email to all users
 * Note: This sends emails in batches to avoid rate limiting
 */
export async function sendBroadcastEmail(
  data: BroadcastEmailData,
  userEmails: Array<{ email: string; name: string | null }>
): Promise<BroadcastResult> {
  const sender = data.fromEmail
    ? getSenderByEmail(data.fromEmail)
    : EMAIL_SENDERS.ceo;

  const result: BroadcastResult = {
    success: true,
    totalUsers: userEmails.length,
    sentCount: 0,
    failedCount: 0,
    errors: [],
  };

  const emailService = await getEmailService();
  const batchId = nanoid();
  const BATCH_SIZE = 10; // Send 10 emails at a time
  const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches

  // Process in batches
  for (let i = 0; i < userEmails.length; i += BATCH_SIZE) {
    const batch = userEmails.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (recipient) => {
        const id = nanoid();
        const threadId = `broadcast-${batchId}`;

        // Create email record
        const [outboundEmail] = await db()
          .insert(email)
          .values({
            id,
            messageId: null,
            threadId,
            direction: 'outbound',
            fromEmail: sender.email,
            fromName: sender.name,
            toEmail: recipient.email,
            toName: recipient.name,
            cc: null,
            bcc: null,
            subject: data.subject,
            textContent: data.textContent || null,
            htmlContent: data.htmlContent || null,
            attachments: null,
            status: 'pending',
            parentId: null,
            replyToMessageId: null,
            isRead: true,
            metadata: JSON.stringify({ broadcast: true, batchId }),
          })
          .returning();

        try {
          const emailContent: {
            to: string;
            from: string;
            subject: string;
            text?: string;
            html?: string;
            replyTo?: string;
          } = {
            to: recipient.email,
            from: sender.from,
            subject: data.subject,
            replyTo: sender.email,
          };

          if (data.textContent) {
            emailContent.text = data.textContent;
          }

          if (data.htmlContent) {
            emailContent.html = data.htmlContent;
          }

          const sendResult = await emailService.sendEmail(emailContent);

          if (sendResult.success) {
            await db()
              .update(email)
              .set({
                status: 'sent',
                messageId: sendResult.messageId || null,
              })
              .where(eq(email.id, id));

            return { success: true, email: recipient.email };
          } else {
            await db()
              .update(email)
              .set({
                status: 'failed',
                metadata: JSON.stringify({ broadcast: true, batchId, error: sendResult.error }),
              })
              .where(eq(email.id, id));

            return { success: false, email: recipient.email, error: sendResult.error };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await db()
            .update(email)
            .set({
              status: 'failed',
              metadata: JSON.stringify({ broadcast: true, batchId, error: errorMessage }),
            })
            .where(eq(email.id, id));

          return { success: false, email: recipient.email, error: errorMessage };
        }
      })
    );

    // Process batch results
    for (const batchResult of batchResults) {
      if (batchResult.status === 'fulfilled') {
        if (batchResult.value.success) {
          result.sentCount++;
        } else {
          result.failedCount++;
          result.errors.push({
            email: batchResult.value.email,
            error: batchResult.value.error || 'Unknown error',
          });
        }
      } else {
        result.failedCount++;
      }
    }

    // Delay between batches (except for the last batch)
    if (i + BATCH_SIZE < userEmails.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  result.success = result.failedCount === 0;

  return result;
}
