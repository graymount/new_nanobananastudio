/**
 * Run all migrations in order
 *
 * Order:
 *   1. Users (must be first - other tables reference users)
 *   2. Usage/Subscriptions (grants credits to users)
 *   3. Images (references users)
 */

import { config, validateConfig } from './config';
import { closeConnections, log } from './db';
import { migrateUsers } from './migrate-users';
import { migrateImages } from './migrate-images';
import { migrateUsage } from './migrate-usage';

interface FullMigrationResult {
  users: Awaited<ReturnType<typeof migrateUsers>>;
  usage: Awaited<ReturnType<typeof migrateUsage>>;
  images: Awaited<ReturnType<typeof migrateImages>>;
  totalTime: number;
  success: boolean;
}

async function runFullMigration(): Promise<FullMigrationResult> {
  validateConfig();

  const startTime = Date.now();

  log('info', '');
  log('info', '╔══════════════════════════════════════════════════════════╗');
  log('info', '║     Nano Banana Studio - Data Migration Tool             ║');
  log('info', '╠══════════════════════════════════════════════════════════╣');
  log('info', `║  Dry Run: ${config.options.dryRun ? 'YES (no changes will be made)' : 'NO (changes will be written)'}          ║`);
  log('info', `║  Batch Size: ${config.options.batchSize}                                         ║`);
  log('info', '╚══════════════════════════════════════════════════════════╝');
  log('info', '');

  const result: FullMigrationResult = {
    users: { totalUsers: 0, migratedUsers: 0, skippedUsers: 0, errors: [] },
    usage: {
      totalUsage: 0,
      migratedSubscriptions: 0,
      migratedCredits: 0,
      skippedUsers: 0,
      errors: [],
    },
    images: { totalImages: 0, migratedImages: 0, skippedImages: 0, errors: [] },
    totalTime: 0,
    success: true,
  };

  try {
    // Step 1: Migrate Users
    log('info', '');
    log('info', '┌────────────────────────────────────────────────────────┐');
    log('info', '│  STEP 1/3: Migrating Users                             │');
    log('info', '└────────────────────────────────────────────────────────┘');
    result.users = await migrateUsers();

    if (result.users.errors.length > result.users.totalUsers * 0.1) {
      log('warn', 'High error rate in user migration, continuing anyway...');
    }

    // Step 2: Migrate Usage/Subscriptions
    log('info', '');
    log('info', '┌────────────────────────────────────────────────────────┐');
    log('info', '│  STEP 2/3: Migrating Usage & Subscriptions             │');
    log('info', '└────────────────────────────────────────────────────────┘');
    result.usage = await migrateUsage();

    // Step 3: Migrate Images
    log('info', '');
    log('info', '┌────────────────────────────────────────────────────────┐');
    log('info', '│  STEP 3/3: Migrating Image History                     │');
    log('info', '└────────────────────────────────────────────────────────┘');
    result.images = await migrateImages();

  } catch (error: any) {
    log('error', 'Migration failed with error:', error.message);
    result.success = false;
  } finally {
    await closeConnections();
  }

  result.totalTime = (Date.now() - startTime) / 1000;

  // Final Summary
  log('info', '');
  log('info', '╔══════════════════════════════════════════════════════════╗');
  log('info', '║              MIGRATION COMPLETE                          ║');
  log('info', '╠══════════════════════════════════════════════════════════╣');
  log('info', `║  Total Time: ${result.totalTime.toFixed(1)}s                                      ║`);
  log('info', '╠──────────────────────────────────────────────────────────╣');
  log('info', '║  USERS:                                                  ║');
  log('info', `║    - Total: ${result.users.totalUsers}                                           ║`);
  log('info', `║    - Migrated: ${result.users.migratedUsers}                                        ║`);
  log('info', `║    - Skipped: ${result.users.skippedUsers}                                         ║`);
  log('info', `║    - Errors: ${result.users.errors.length}                                          ║`);
  log('info', '╠──────────────────────────────────────────────────────────╣');
  log('info', '║  USAGE/SUBSCRIPTIONS:                                    ║');
  log('info', `║    - Total: ${result.usage.totalUsage}                                           ║`);
  log('info', `║    - Subscriptions: ${result.usage.migratedSubscriptions}                                  ║`);
  log('info', `║    - Credits: ${result.usage.migratedCredits}                                        ║`);
  log('info', `║    - Errors: ${result.usage.errors.length}                                          ║`);
  log('info', '╠──────────────────────────────────────────────────────────╣');
  log('info', '║  IMAGES:                                                 ║');
  log('info', `║    - Total: ${result.images.totalImages}                                           ║`);
  log('info', `║    - Migrated: ${result.images.migratedImages}                                        ║`);
  log('info', `║    - Skipped: ${result.images.skippedImages}                                         ║`);
  log('info', `║    - Errors: ${result.images.errors.length}                                          ║`);
  log('info', '╚══════════════════════════════════════════════════════════╝');

  if (config.options.dryRun) {
    log('info', '');
    log('info', '⚠️  This was a DRY RUN - no changes were made to the database.');
    log('info', '    To run the actual migration, set DRY_RUN=false');
  }

  return result;
}

// Parse command line arguments
function parseArgs(): { step?: string } {
  const args = process.argv.slice(2);
  const result: { step?: string } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--step' && args[i + 1]) {
      result.step = args[i + 1];
      i++;
    }
  }

  return result;
}

// Main entry point
async function main() {
  const args = parseArgs();

  if (args.step) {
    // Run single step
    log('info', `Running single step: ${args.step}`);

    try {
      switch (args.step) {
        case 'users':
          await migrateUsers();
          break;
        case 'usage':
          await migrateUsage();
          break;
        case 'images':
          await migrateImages();
          break;
        default:
          console.error(`Unknown step: ${args.step}`);
          console.error('Valid steps: users, usage, images');
          process.exit(1);
      }
    } finally {
      await closeConnections();
    }
  } else {
    // Run full migration
    const result = await runFullMigration();
    process.exit(result.success ? 0 : 1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
