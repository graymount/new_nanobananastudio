/**
 * Check R2 Storage Configuration
 *
 * Run with: pnpm tsx scripts/check-r2-config.ts
 */

import { db } from '../src/core/db';
import { config } from '../src/config/db/schema';
import { like } from 'drizzle-orm';

async function checkR2Config() {
  console.log('Checking R2 Storage Configuration...\n');

  try {
    // Get all R2-related configs
    const r2Configs = await db()
      .select()
      .from(config)
      .where(like(config.name, 'r2_%'));

    console.log('R2 Configuration from Database:');
    console.log('─'.repeat(60));

    if (r2Configs.length === 0) {
      console.log('❌ No R2 configuration found in database!');
      console.log('\nThis is likely the cause of "upload image failed" error.');
      console.log('\nTo fix this, add R2 configuration via Admin Panel:');
      console.log('  1. Assign admin role to your user');
      console.log('  2. Go to /admin/settings/storage');
      console.log('  3. Configure R2 credentials');
    } else {
      for (const cfg of r2Configs) {
        const value = cfg.value;
        // Mask sensitive values
        const displayValue =
          cfg.name.includes('key') || cfg.name.includes('secret')
            ? value
              ? `${value.slice(0, 10)}...`
              : '(empty)'
            : value || '(empty)';
        console.log(`  ${cfg.name}: ${displayValue}`);
      }
    }

    console.log('─'.repeat(60));

    // Check environment variables as fallback
    console.log('\nEnvironment Variables Check:');
    const envKeys = [
      'R2_ACCESS_KEY',
      'R2_SECRET_KEY',
      'R2_BUCKET_NAME',
      'R2_ACCOUNT_ID',
      'R2_DOMAIN',
      'R2_ENDPOINT',
    ];

    let hasEnvConfig = false;
    for (const key of envKeys) {
      const value = process.env[key];
      if (value) {
        hasEnvConfig = true;
        const displayValue = key.includes('KEY') || key.includes('SECRET')
          ? `${value.slice(0, 10)}...`
          : value;
        console.log(`  ${key}: ${displayValue}`);
      }
    }

    if (!hasEnvConfig) {
      console.log('  ℹ️  No R2 environment variables set');
    }

    console.log('\n');
  } catch (error) {
    console.error('❌ Error checking R2 config:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkR2Config();
