import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { getAllConfigs } from '@/shared/models/config';
import {
  createInboundEmail,
  EmailAttachment,
} from '@/shared/services/admin-email';

// Webhook payload from Cloudflare Email Worker
interface CloudflareEmailPayload {
  messageId: string;
  from: {
    address: string;
    name?: string;
  };
  to: {
    address: string;
    name?: string;
  };
  cc?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
    size: number;
  }>;
  headers?: Record<string, string>;
  timestamp?: string;
}

/**
 * Verify webhook signature
 */
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/webhook/email
 * Receive email from Cloudflare Email Worker
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();

    // Get webhook secret from config
    const configs = await getAllConfigs();
    const webhookSecret = configs.email_webhook_secret;

    // Verify signature if webhook secret is configured
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature');
      if (!signature) {
        console.error('Email webhook: Missing signature');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }

      if (!verifySignature(body, signature, webhookSecret)) {
        console.error('Email webhook: Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: CloudflareEmailPayload = JSON.parse(body);

    // Validate required fields
    if (!payload.from?.address || !payload.to?.address || !payload.subject) {
      console.error('Email webhook: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process attachments - store as base64 for now
    // In production, you might want to upload to R2/S3
    let attachments: EmailAttachment[] = [];
    if (payload.attachments && payload.attachments.length > 0) {
      attachments = payload.attachments.map((att) => ({
        filename: att.filename,
        url: `data:${att.contentType};base64,${att.content}`,
        contentType: att.contentType,
        size: att.size,
      }));
    }

    // Create inbound email record
    const emailRecord = await createInboundEmail({
      messageId: payload.messageId,
      fromEmail: payload.from.address,
      fromName: payload.from.name,
      toEmail: payload.to.address,
      toName: payload.to.name,
      cc: payload.cc,
      subject: payload.subject,
      textContent: payload.text,
      htmlContent: payload.html,
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        headers: payload.headers,
        receivedAt: payload.timestamp || new Date().toISOString(),
      },
    });

    console.log(`Email webhook: Received email ${emailRecord.id} from ${payload.from.address}`);

    return NextResponse.json({
      success: true,
      emailId: emailRecord.id,
    });
  } catch (error) {
    console.error('Email webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/email
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'email-webhook',
    timestamp: new Date().toISOString(),
  });
}
