import { getAllConfigs } from '@/shared/models/config';

const MODERATION_TIMEOUT_MS = 5000;

export type ModerationDecision = 'allow' | 'flag' | 'deny';

export interface ModerationResult {
  id: string;
  decision: ModerationDecision;
  prompt: string;
  external_id?: string;
}

export interface ModerationOutcome {
  allowed: boolean;
  decision: ModerationDecision;
  id: string;
}

export class ModerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: 'rejected' | 'service_unavailable'
  ) {
    super(message);
    this.name = 'ModerationError';
  }
}

export async function moderatePrompt({
  prompt,
  externalId,
}: {
  prompt: string;
  externalId?: string;
}): Promise<ModerationOutcome> {
  const configs = await getAllConfigs();

  if (configs.creem_enabled !== 'true' || !configs.creem_api_key) {
    throw new ModerationError(
      'moderation service not configured',
      'service_unavailable'
    );
  }

  const baseUrl =
    configs.creem_environment === 'production'
      ? 'https://api.creem.io'
      : 'https://test-api.creem.io';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODERATION_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/v1/moderation/prompt`, {
      method: 'POST',
      headers: {
        'x-api-key': configs.creem_api_key,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        external_id: externalId,
      }),
      signal: controller.signal,
    });
  } catch (e: any) {
    throw new ModerationError(
      `moderation request failed: ${e?.message || 'network error'}`,
      'service_unavailable'
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ModerationError(
      `moderation request failed: status ${response.status}, body: ${body.slice(0, 200)}`,
      'service_unavailable'
    );
  }

  const result = (await response.json()) as ModerationResult;
  const allowed = result.decision === 'allow';

  return {
    allowed,
    decision: result.decision,
    id: result.id,
  };
}
