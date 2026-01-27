/**
 * Migrate usage/subscription data from old site to new site
 *
 * Old site table (public schema):
 *   - usage: id, user_id, plan, quota_left, expires_at, updated_at
 *
 * New site tables (configured schema):
 *   - subscription: id, user_id, order_id, plan_title, status, credits_amount, etc.
 *   - credit: id, user_id, user_email, transaction_no, transaction_type, credits, remaining_credits, etc.
 */

import { randomUUID } from 'crypto';
import { config, validateConfig } from './config';
import { getDb, closeConnections, log, ProgressTracker } from './db';

interface OldUsage {
  id: string;
  user_id: string;
  plan: string; // 'free', 'pro', 'max'
  quota_left: number;
  expires_at: Date | null;
  updated_at: Date | null;
}

interface MigrationResult {
  totalUsage: number;
  migratedSubscriptions: number;
  migratedCredits: number;
  skippedUsers: number;
  errors: Array<{ userId: string; error: string }>;
}

// Plan configuration (must match old site)
const PLAN_CONFIG: Record<string, { credits: number; title: string }> = {
  free: { credits: 8, title: 'Free' },
  pro: { credits: 300, title: 'Pro' },
  max: { credits: 1000, title: 'Max' },
};

// Generate a Snowflake-like ID for transaction numbers
function generateTransactionNo(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `MIG-${timestamp}-${random}`.toUpperCase();
}

export async function migrateUsage(): Promise<MigrationResult> {
  validateConfig();
  log('info', '=== Starting Usage/Subscription Migration ===');

  const { sql } = getDb();
  const schema = config.newSite.dbSchema;

  const result: MigrationResult = {
    totalUsage: 0,
    migratedSubscriptions: 0,
    migratedCredits: 0,
    skippedUsers: 0,
    errors: [],
  };

  try {
    // 1. Fetch all usage records from old site (public schema)
    log('info', 'Fetching usage records from old site...');
    const usageRecords = await sql<OldUsage[]>`
      SELECT id, user_id, plan, quota_left, expires_at, updated_at
      FROM public.usage
    `;

    if (!usageRecords || usageRecords.length === 0) {
      log('warn', 'No usage records found in old site');
      return result;
    }

    result.totalUsage = usageRecords.length;
    log('info', `Found ${result.totalUsage} usage records to migrate`);

    // 2. Get valid user IDs from new site
    log('info', 'Fetching valid user IDs from new site...');
    const validUsers = await sql`
      SELECT id, email FROM "${sql.unsafe(schema)}"."user"
    `;
    const validUserIds = new Set(validUsers.map((u: any) => u.id));
    const userEmails = new Map(validUsers.map((u: any) => [u.id, u.email]));
    log('info', `Found ${validUserIds.size} valid users in new site`);

    // 3. Check for existing migrated credits (to avoid duplicates)
    log('info', 'Checking for already migrated credits...');
    const existingCredits = await sql`
      SELECT user_id, transaction_no FROM "${sql.unsafe(schema)}".credit
      WHERE transaction_no LIKE 'MIG-%'
    `;
    const migratedUserIds = new Set(existingCredits.map((c: any) => c.user_id));
    log('info', `Found ${migratedUserIds.size} users with migrated credits`);

    // 4. Migrate usage records
    const progress = new ProgressTracker('Usage Migration', result.totalUsage);

    for (const usage of usageRecords) {
      try {
        // Skip if user doesn't exist in new site
        if (!validUserIds.has(usage.user_id)) {
          log('debug', `Skipping usage for user ${usage.user_id} - user not found`);
          result.skippedUsers++;
          progress.increment();
          continue;
        }

        // Skip if already migrated
        if (migratedUserIds.has(usage.user_id)) {
          log('debug', `Skipping usage for user ${usage.user_id} - already migrated`);
          result.skippedUsers++;
          progress.increment();
          continue;
        }

        const planConfig = PLAN_CONFIG[usage.plan] || PLAN_CONFIG.free;
        const now = new Date();
        const expiresAt = usage.expires_at ? new Date(usage.expires_at) : null;
        const isExpired = expiresAt && expiresAt < now;
        const hasQuota = usage.quota_left > 0;
        const userEmail = userEmails.get(usage.user_id) || '';

        if (config.options.dryRun) {
          log(
            'debug',
            `[DRY RUN] Would migrate usage for user ${usage.user_id}: plan=${usage.plan}, quota=${usage.quota_left}`
          );
          if (usage.plan !== 'free') result.migratedSubscriptions++;
          if (hasQuota && !isExpired) result.migratedCredits++;
          progress.increment();
          continue;
        }

        // Create subscription record for paid plans
        if (usage.plan !== 'free') {
          const subscriptionId = randomUUID();
          const periodStart = expiresAt
            ? new Date(expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000)
            : new Date();

          await sql`
            INSERT INTO "${sql.unsafe(schema)}".subscription (
              id, user_id, subscription_no, subscription_id, plan_name, status,
              payment_provider, credits_amount,
              current_period_start, current_period_end,
              created_at, updated_at
            ) VALUES (
              ${subscriptionId},
              ${usage.user_id},
              ${'MIG-' + usage.id},
              ${'migrated-' + usage.id},
              ${planConfig.title},
              ${isExpired ? 'expired' : 'active'},
              'migration',
              ${planConfig.credits},
              ${periodStart.toISOString()},
              ${expiresAt ? expiresAt.toISOString() : null},
              NOW(),
              NOW()
            )
          `;

          result.migratedSubscriptions++;
          log('debug', `Created subscription for user ${usage.user_id}: ${planConfig.title}`);
        }

        // Create credit record if user has remaining quota
        if (hasQuota) {
          const creditId = randomUUID();
          const transactionNo = generateTransactionNo();
          const creditStatus = isExpired ? 'expired' : 'active';

          await sql`
            INSERT INTO "${sql.unsafe(schema)}".credit (
              id, user_id, user_email, transaction_no,
              transaction_type, transaction_scene,
              credits, remaining_credits,
              description, expires_at, status,
              created_at, updated_at
            ) VALUES (
              ${creditId},
              ${usage.user_id},
              ${userEmail},
              ${transactionNo},
              'grant',
              'subscription',
              ${usage.quota_left},
              ${isExpired ? 0 : usage.quota_left},
              ${'Migrated from old site (' + usage.plan + ' plan)'},
              ${expiresAt ? expiresAt.toISOString() : null},
              ${creditStatus},
              NOW(),
              NOW()
            )
          `;

          result.migratedCredits++;
          log(
            'debug',
            `Created credit for user ${usage.user_id}: ${usage.quota_left} credits (${creditStatus})`
          );
        }

        migratedUserIds.add(usage.user_id);
      } catch (error: any) {
        log('error', `Failed to migrate usage for user ${usage.user_id}:`, error.message);
        result.errors.push({
          userId: usage.user_id,
          error: error.message,
        });
      }

      progress.increment();
    }

    progress.finish();
  } finally {
    // Don't close connections here - let the caller handle it
  }

  // Summary
  log('info', '=== Usage Migration Summary ===');
  log('info', `Total usage records: ${result.totalUsage}`);
  log('info', `Migrated subscriptions: ${result.migratedSubscriptions}`);
  log('info', `Migrated credits: ${result.migratedCredits}`);
  log('info', `Skipped users: ${result.skippedUsers}`);
  log('info', `Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    log('warn', 'Errors encountered:');
    result.errors.slice(0, 10).forEach((e) => log('warn', `  - ${e.userId}: ${e.error}`));
  }

  return result;
}

// Run if executed directly
if (require.main === module) {
  migrateUsage()
    .then(() => closeConnections())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      closeConnections().then(() => process.exit(1));
    });
}
