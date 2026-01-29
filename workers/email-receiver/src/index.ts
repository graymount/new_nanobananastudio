/**
 * Cloudflare Email Receiver Worker
 *
 * This worker receives emails via Cloudflare Email Routing
 * and forwards them to the webhook endpoint.
 */

import PostalMime from 'postal-mime';

interface Env {
  WEBHOOK_URL: string;
  WEBHOOK_SECRET?: string;
}

interface EmailAddress {
  address: string;
  name?: string;
}

interface WebhookPayload {
  messageId: string;
  from: EmailAddress;
  to: EmailAddress;
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
  timestamp: string;
}

/**
 * Generate HMAC-SHA256 signature for webhook verification
 */
async function generateSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Parse email address from postal-mime Address type or string
 */
function parseEmailAddress(addressObj: unknown): EmailAddress {
  if (typeof addressObj === 'string') {
    // Parse string format like "Name <email@example.com>" or "email@example.com"
    const match = addressObj.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    if (match) {
      return {
        address: match[2].trim(),
        name: match[1]?.trim() || undefined,
      };
    }
    return { address: addressObj };
  }

  if (addressObj && typeof addressObj === 'object') {
    const obj = addressObj as Record<string, unknown>;
    // Handle postal-mime Address type
    if (typeof obj.address === 'string') {
      return {
        address: obj.address,
        name: typeof obj.name === 'string' ? obj.name : undefined,
      };
    }
    // Handle group type (use first address in group)
    if (Array.isArray(obj.group) && obj.group.length > 0) {
      return parseEmailAddress(obj.group[0]);
    }
  }

  return { address: 'unknown@unknown.com' };
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    console.log(`Received email from: ${message.from} to: ${message.to}`);

    try {
      // Read the raw email content
      const rawEmail = await new Response(message.raw).arrayBuffer();

      // Parse the email using postal-mime
      const parser = new PostalMime();
      const parsedEmail = await parser.parse(rawEmail);

      // Build the webhook payload
      const payload: WebhookPayload = {
        messageId: parsedEmail.messageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: parseEmailAddress(parsedEmail.from || message.from),
        to: parseEmailAddress(parsedEmail.to?.[0] || message.to),
        subject: parsedEmail.subject || '(No Subject)',
        text: parsedEmail.text || undefined,
        html: parsedEmail.html || undefined,
        timestamp: new Date().toISOString(),
      };

      // Add CC if present
      if (parsedEmail.cc && parsedEmail.cc.length > 0) {
        payload.cc = parsedEmail.cc
          .map((addr) => parseEmailAddress(addr).address)
          .filter((addr) => addr !== 'unknown@unknown.com')
          .join(', ');
      }

      // Process attachments
      if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
        payload.attachments = parsedEmail.attachments.map((att) => {
          const content = att.content;
          let base64Content: string;
          let size: number;

          if (typeof content === 'string') {
            // Content is already a string (possibly base64)
            base64Content = content;
            size = content.length;
          } else {
            // Content is ArrayBuffer
            base64Content = arrayBufferToBase64(content);
            size = content.byteLength;
          }

          return {
            filename: att.filename || 'attachment',
            content: base64Content,
            contentType: att.mimeType || 'application/octet-stream',
            size,
          };
        });
      }

      // Add selected headers
      if (parsedEmail.headers && parsedEmail.headers.length > 0) {
        const headersMap: Record<string, string> = {};
        for (const header of parsedEmail.headers) {
          if (['message-id', 'in-reply-to', 'references', 'date', 'reply-to'].includes(header.key.toLowerCase())) {
            headersMap[header.key] = header.value;
          }
        }
        if (Object.keys(headersMap).length > 0) {
          payload.headers = headersMap;
        }
      }

      // Send to webhook
      const payloadJson = JSON.stringify(payload);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add signature if webhook secret is configured
      if (env.WEBHOOK_SECRET) {
        const signature = await generateSignature(payloadJson, env.WEBHOOK_SECRET);
        headers['x-webhook-signature'] = signature;
      }

      const response = await fetch(env.WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: payloadJson,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook failed with status ${response.status}: ${errorText}`);
        // Don't throw - we don't want to reject the email
        // The email has been received, just logging the failure
      } else {
        const result = await response.json();
        console.log(`Email forwarded successfully. Email ID: ${(result as { emailId?: string }).emailId}`);
      }
    } catch (error) {
      console.error('Error processing email:', error);
      // Don't throw - we don't want to reject the email
    }
  },
};
