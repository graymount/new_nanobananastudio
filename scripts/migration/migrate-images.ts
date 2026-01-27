/**
 * Migrate image history from old site to new site
 *
 * Old site table (public schema):
 *   - image_history: id, user_id, mode, prompt, style, input_image_url, r2_key, created_at
 *
 * New site table (configured schema):
 *   - ai_task: id, user_id, media_type, provider, model, prompt, options, status,
 *              task_info, scene, cost_credits, created_at, updated_at
 */

import { randomUUID } from 'crypto';
import { config, validateConfig } from './config';
import { getDb, closeConnections, log, ProgressTracker } from './db';

interface OldImageHistory {
  id: number | string;
  user_id: string;
  mode: string; // 'text-to-image' or 'image_edit'
  prompt: string | null;
  style: string | null;
  input_image_url: string | null;
  output_image_url: string | null; // deprecated
  r2_key: string | null;
  created_at: Date;
}

interface MigrationResult {
  totalImages: number;
  migratedImages: number;
  skippedImages: number;
  errors: Array<{ imageId: string; error: string }>;
}

function buildImageUrl(r2Key: string | null, outputUrl: string | null): string | null {
  if (r2Key) {
    return `${config.oldSite.r2Domain}/${r2Key}`;
  }
  if (outputUrl && outputUrl.startsWith('http')) {
    return outputUrl;
  }
  return null;
}

function mapScene(mode: string): string {
  if (mode === 'image_edit' || mode === 'image-edit' || mode === 'image-to-image') {
    return 'image-to-image';
  }
  return 'text-to-image';
}

export async function migrateImages(): Promise<MigrationResult> {
  validateConfig();
  log('info', '=== Starting Image History Migration ===');

  const { sql } = getDb();
  const schema = config.newSite.dbSchema;
  const batchSize = config.options.batchSize;

  const result: MigrationResult = {
    totalImages: 0,
    migratedImages: 0,
    skippedImages: 0,
    errors: [],
  };

  try {
    // 1. Count images in old site (public schema)
    log('info', 'Counting images in old site...');
    const countResult = await sql`SELECT COUNT(*)::int as count FROM public.image_history`;
    result.totalImages = countResult[0]?.count || 0;
    log('info', `Found ${result.totalImages} images to migrate`);

    if (result.totalImages === 0) {
      return result;
    }

    // 2. Get valid user IDs from new site
    log('info', 'Fetching valid user IDs from new site...');
    const validUsers = await sql`SELECT id FROM "${sql.unsafe(schema)}"."user"`;
    const validUserIds = new Set(validUsers.map((u: any) => u.id));
    log('info', `Found ${validUserIds.size} valid users in new site`);

    // 3. Check for existing migrated images (by checking metadata)
    log('info', 'Checking for already migrated images...');
    const existingTasks = await sql`
      SELECT id, options FROM "${sql.unsafe(schema)}".ai_task
      WHERE options LIKE '%"migrated_from"%'
    `;
    const migratedImageIds = new Set<string>();
    for (const task of existingTasks) {
      try {
        const options = JSON.parse(task.options || '{}');
        if (options.migrated_from) {
          migratedImageIds.add(String(options.migrated_from));
        }
      } catch {
        // Ignore parse errors
      }
    }
    log('info', `Found ${migratedImageIds.size} already migrated images`);

    // 4. Migrate in batches
    const progress = new ProgressTracker('Image Migration', result.totalImages);
    let offset = 0;

    while (offset < result.totalImages) {
      // Fetch batch from old site (public schema)
      const images = await sql<OldImageHistory[]>`
        SELECT id, user_id, mode, prompt, style, input_image_url, output_image_url, r2_key, created_at
        FROM public.image_history
        ORDER BY created_at ASC
        LIMIT ${batchSize}
        OFFSET ${offset}
      `;

      if (!images || images.length === 0) {
        break;
      }

      // Process batch
      for (const img of images) {
        const imageIdStr = String(img.id);

        try {
          // Skip if already migrated
          if (migratedImageIds.has(imageIdStr)) {
            log('debug', `Skipping image ${img.id} - already migrated`);
            result.skippedImages++;
            progress.increment();
            continue;
          }

          // Skip if user doesn't exist in new site
          if (!validUserIds.has(img.user_id)) {
            log('debug', `Skipping image ${img.id} - user ${img.user_id} not found`);
            result.skippedImages++;
            progress.increment();
            continue;
          }

          // Build image URL
          const imageUrl = buildImageUrl(img.r2_key, img.output_image_url);
          if (!imageUrl) {
            log('debug', `Skipping image ${img.id} - no valid URL`);
            result.skippedImages++;
            progress.increment();
            continue;
          }

          if (config.options.dryRun) {
            log('debug', `[DRY RUN] Would migrate image: ${img.id}`);
            result.migratedImages++;
            progress.increment();
            continue;
          }

          // Build task data
          const taskId = randomUUID();
          const scene = mapScene(img.mode);
          const options = JSON.stringify({
            style: img.style,
            migrated_from: imageIdStr, // Track original ID
            migrated_at: new Date().toISOString(),
          });
          const taskInfo = JSON.stringify({
            images: [
              {
                imageUrl: imageUrl,
                createTime: img.created_at,
              },
            ],
            status: 'SUCCESS',
          });

          // Insert into ai_task
          await sql`
            INSERT INTO "${sql.unsafe(schema)}".ai_task (
              id, user_id, media_type, provider, model, prompt,
              options, status, task_info, scene, cost_credits,
              created_at, updated_at
            ) VALUES (
              ${taskId},
              ${img.user_id},
              'image',
              'gemini',
              'gemini-2.5-flash-image',
              ${img.prompt || ''},
              ${options},
              'success',
              ${taskInfo},
              ${scene},
              0,
              ${img.created_at},
              NOW()
            )
          `;

          result.migratedImages++;
          migratedImageIds.add(imageIdStr);
          log('debug', `Migrated image: ${img.id}`);
        } catch (error: any) {
          log('error', `Failed to migrate image ${img.id}:`, error.message);
          result.errors.push({
            imageId: imageIdStr,
            error: error.message,
          });
        }

        progress.increment();
      }

      offset += batchSize;
    }

    progress.finish();
  } finally {
    // Don't close connections here - let the caller handle it
  }

  // Summary
  log('info', '=== Image Migration Summary ===');
  log('info', `Total images: ${result.totalImages}`);
  log('info', `Migrated: ${result.migratedImages}`);
  log('info', `Skipped: ${result.skippedImages}`);
  log('info', `Errors: ${result.errors.length}`);

  if (result.errors.length > 0 && result.errors.length <= 10) {
    log('warn', 'Errors encountered:');
    result.errors.forEach((e) => log('warn', `  - ${e.imageId}: ${e.error}`));
  } else if (result.errors.length > 10) {
    log('warn', `First 10 errors:`);
    result.errors.slice(0, 10).forEach((e) => log('warn', `  - ${e.imageId}: ${e.error}`));
  }

  return result;
}

// Run if executed directly
if (require.main === module) {
  migrateImages()
    .then(() => closeConnections())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      closeConnections().then(() => process.exit(1));
    });
}
