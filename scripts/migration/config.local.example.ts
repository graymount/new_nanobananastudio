/**
 * Local Configuration Example
 *
 * Copy this file to config.local.ts and fill in your actual credentials.
 * DO NOT commit config.local.ts to version control!
 */

import { MigrationConfig } from './config';

export const config: Partial<MigrationConfig> = {
  oldSite: {
    // Get these from your old Supabase project settings
    supabaseUrl: 'https://xxxxxxxxxx.supabase.co',
    supabaseServiceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxx', // Service role key
    r2Domain: 'https://images.nanobananastudio.com', // Your R2 public domain
  },

  newSite: {
    // Get this from your new site's .env file
    databaseUrl: 'postgresql://user:password@host:5432/database',
    dbSchema: 'nanobananastudio_new', // or 'public' if using default schema
  },

  options: {
    dryRun: true, // Set to false to actually write data
    batchSize: 100, // Records per batch
    logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'
  },
};
