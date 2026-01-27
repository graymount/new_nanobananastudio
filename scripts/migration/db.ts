/**
 * Database connections for migration
 *
 * Note: Both old and new sites use the same Supabase PostgreSQL database.
 * Old site tables: users, usage, image_history (in 'public' schema)
 * New site tables: user, credit, subscription, ai_task (in configured schema)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from './config';

// Shared PostgreSQL client
let pgClient: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!pgClient || !db) {
    pgClient = postgres(config.newSite.databaseUrl, {
      max: 3,
      idle_timeout: 30,
      connect_timeout: 15,
      ssl: 'require',
    });

    db = drizzle(pgClient, {
      schema: undefined, // We'll use raw SQL for flexibility
    });
  }
  return { db, sql: pgClient! };
}

// Close connections
export async function closeConnections(): Promise<void> {
  if (pgClient) {
    await pgClient.end();
    pgClient = null;
    db = null;
  }
}

// Legacy exports for compatibility
export function getOldSiteClient() {
  // Not used anymore - we query old tables directly via SQL
  throw new Error('Use getDb() instead - old site tables are queried via PostgreSQL');
}

export function getNewSiteDb() {
  return getDb();
}

// Logger utility
const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };

export function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: any
): void {
  if (logLevels[level] >= logLevels[config.options.logLevel]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data !== undefined) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}

// Progress tracker
export class ProgressTracker {
  private total: number;
  private current: number = 0;
  private startTime: number;
  private name: string;

  constructor(name: string, total: number) {
    this.name = name;
    this.total = total;
    this.startTime = Date.now();
    log('info', `Starting ${name}: ${total} records to process`);
  }

  increment(count: number = 1): void {
    this.current += count;
    if (this.current % 100 === 0 || this.current === this.total) {
      const percent = ((this.current / this.total) * 100).toFixed(1);
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
      log('info', `${this.name}: ${this.current}/${this.total} (${percent}%) - ${elapsed}s`);
    }
  }

  finish(): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    log('info', `Completed ${this.name}: ${this.current} records in ${elapsed}s`);
  }
}
