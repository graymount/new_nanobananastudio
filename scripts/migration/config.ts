/**
 * Migration Configuration
 *
 * Before running migration, copy this file to config.local.ts
 * and fill in your actual credentials.
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env files from project root
dotenvConfig({ path: resolve(__dirname, '../../.env.local') });
dotenvConfig({ path: resolve(__dirname, '../../.env') });

export interface MigrationConfig {
  // Old site Supabase (source)
  oldSite: {
    supabaseUrl: string;
    supabaseServiceKey: string; // Service role key (has full access)
    r2Domain: string; // e.g., https://images.nanobananastudio.com
  };

  // New site database (target)
  newSite: {
    databaseUrl: string; // PostgreSQL connection string
    dbSchema: string; // e.g., 'nanobananastudio_new' or 'public'
  };

  // Migration options
  options: {
    dryRun: boolean; // If true, don't actually write to database
    batchSize: number; // Number of records to process at a time
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Default config (override in config.local.ts)
export const config: MigrationConfig = {
  oldSite: {
    supabaseUrl: process.env.OLD_SUPABASE_URL || '',
    supabaseServiceKey: process.env.OLD_SUPABASE_SERVICE_KEY || '',
    r2Domain: process.env.OLD_R2_DOMAIN || 'https://cdn.nanobananastudio.com',
  },

  newSite: {
    databaseUrl: process.env.DATABASE_URL || '',
    dbSchema: process.env.DB_SCHEMA || 'public',
  },

  options: {
    dryRun: process.env.DRY_RUN === 'true',
    batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  },
};

// Try to load local config
try {
  const localConfig = require('./config.local').config;
  Object.assign(config.oldSite, localConfig.oldSite);
  Object.assign(config.newSite, localConfig.newSite);
  Object.assign(config.options, localConfig.options);
} catch {
  // Local config not found, using defaults
}

// Validation
export function validateConfig(): void {
  const errors: string[] = [];

  // Only DATABASE_URL is required since we query all tables via PostgreSQL
  if (!config.newSite.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error('\nPlease set environment variables or create config.local.ts');
    process.exit(1);
  }
}
