/**
 * Migrate users from old site to new site
 *
 * Old site table (public schema):
 *   - users: id, google_sub, email, name, avatar_url, created_at
 *
 * New site tables (configured schema):
 *   - user: id, name, email, email_verified, image, created_at, updated_at
 *   - account: id, user_id, provider_id, account_id, created_at, updated_at
 */

import { config, validateConfig } from './config';
import { getDb, closeConnections, log, ProgressTracker } from './db';

interface OldUser {
  id: string;
  google_sub: string | null;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: Date;
}

interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  skippedUsers: number;
  errors: Array<{ userId: string; error: string }>;
}

export async function migrateUsers(): Promise<MigrationResult> {
  validateConfig();
  log('info', '=== Starting User Migration ===');

  const { sql } = getDb();
  const schema = config.newSite.dbSchema;

  const result: MigrationResult = {
    totalUsers: 0,
    migratedUsers: 0,
    skippedUsers: 0,
    errors: [],
  };

  try {
    // 1. Fetch all users from old site (public schema)
    log('info', 'Fetching users from old site...');
    const oldUsers = await sql<OldUser[]>`
      SELECT id, google_sub, email, name, avatar_url, created_at
      FROM public.users
      ORDER BY created_at ASC
    `;

    if (!oldUsers || oldUsers.length === 0) {
      log('warn', 'No users found in old site');
      return result;
    }

    result.totalUsers = oldUsers.length;
    log('info', `Found ${oldUsers.length} users to migrate`);

    // 2. Get existing users in new site (to avoid duplicates)
    log('info', 'Checking existing users in new site...');
    const existingUsers = await sql`
      SELECT id, email FROM "${sql.unsafe(schema)}"."user"
    `;
    const existingEmails = new Set(existingUsers.map((u: any) => u.email?.toLowerCase()));
    const existingIds = new Set(existingUsers.map((u: any) => u.id));

    log('info', `Found ${existingUsers.length} existing users in new site`);

    // 3. Migrate users
    const progress = new ProgressTracker('User Migration', oldUsers.length);

    for (const oldUser of oldUsers) {
      try {
        // Skip if email already exists
        if (existingEmails.has(oldUser.email?.toLowerCase())) {
          log('debug', `Skipping user ${oldUser.email} - already exists`);
          result.skippedUsers++;
          progress.increment();
          continue;
        }

        // Skip if ID already exists
        if (existingIds.has(oldUser.id)) {
          log('debug', `Skipping user ${oldUser.id} - ID already exists`);
          result.skippedUsers++;
          progress.increment();
          continue;
        }

        if (config.options.dryRun) {
          log('debug', `[DRY RUN] Would migrate user: ${oldUser.email}`);
          result.migratedUsers++;
          progress.increment();
          continue;
        }

        // Insert user
        await sql`
          INSERT INTO "${sql.unsafe(schema)}"."user" (
            id, name, email, email_verified, image, created_at, updated_at
          ) VALUES (
            ${oldUser.id},
            ${oldUser.name || oldUser.email?.split('@')[0] || 'User'},
            ${oldUser.email},
            true,
            ${oldUser.avatar_url},
            ${oldUser.created_at},
            NOW()
          )
        `;

        // Insert account (Google OAuth) if google_sub exists
        if (oldUser.google_sub) {
          const accountId = `acc_${oldUser.id.slice(0, 8)}`;
          await sql`
            INSERT INTO "${sql.unsafe(schema)}".account (
              id, user_id, provider_id, account_id, created_at, updated_at
            ) VALUES (
              ${accountId},
              ${oldUser.id},
              'google',
              ${oldUser.google_sub},
              ${oldUser.created_at},
              NOW()
            )
          `;
        }

        result.migratedUsers++;
        existingEmails.add(oldUser.email?.toLowerCase());
        existingIds.add(oldUser.id);

        log('debug', `Migrated user: ${oldUser.email}`);
      } catch (error: any) {
        log('error', `Failed to migrate user ${oldUser.email}:`, error.message);
        result.errors.push({
          userId: oldUser.id,
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
  log('info', '=== User Migration Summary ===');
  log('info', `Total users: ${result.totalUsers}`);
  log('info', `Migrated: ${result.migratedUsers}`);
  log('info', `Skipped (already exists): ${result.skippedUsers}`);
  log('info', `Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    log('warn', 'Errors encountered:');
    result.errors.forEach((e) => log('warn', `  - ${e.userId}: ${e.error}`));
  }

  return result;
}

// Run if executed directly
if (require.main === module) {
  migrateUsers()
    .then(() => closeConnections())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      closeConnections().then(() => process.exit(1));
    });
}
