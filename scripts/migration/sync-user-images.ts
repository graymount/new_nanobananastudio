/**
 * Sync images from old site (public.image_history) to new site (nanobananastudio_new.ai_task)
 *
 * Usage:
 *   pnpm tsx scripts/migration/sync-user-images.ts [email]
 *
 * Example:
 *   pnpm tsx scripts/migration/sync-user-images.ts wnfng.liu@gmail.com
 */

import 'dotenv/config';
import postgres from 'postgres';
import { randomUUID } from 'crypto';

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

interface OldImage {
  id: number;
  user_id: string;
  mode: string;
  prompt: string;
  style: string | null;
  input_image_url: string | null;
  output_image_url: string;
  r2_key: string | null;
  created_at: Date;
}

interface UserMapping {
  oldUserId: string;
  newUserId: string;
  email: string;
}

async function getUserMapping(email: string): Promise<UserMapping | null> {
  // Get old user
  const [oldUser] = await sql`
    SELECT id, email FROM public.users WHERE email = ${email}
  `;

  if (!oldUser) {
    console.log(`User not found in old site: ${email}`);
    return null;
  }

  // Get new user
  const [newUser] = await sql`
    SELECT id, email FROM nanobananastudio_new.user WHERE email = ${email}
  `;

  if (!newUser) {
    console.log(`User not found in new site: ${email}`);
    return null;
  }

  return {
    oldUserId: oldUser.id,
    newUserId: newUser.id,
    email: email,
  };
}

async function getExistingTaskPrompts(userId: string): Promise<Set<string>> {
  const tasks = await sql`
    SELECT prompt, created_at FROM nanobananastudio_new.ai_task
    WHERE user_id = ${userId}
  `;

  // Create a set of "prompt|timestamp" to avoid duplicates
  const existing = new Set<string>();
  tasks.forEach(t => {
    const key = `${t.prompt}|${new Date(t.created_at).toISOString().split('T')[0]}`;
    existing.add(key);
  });

  return existing;
}

async function syncUserImages(email: string) {
  console.log(`\n=== Syncing images for ${email} ===`);

  const mapping = await getUserMapping(email);
  if (!mapping) return;

  console.log(`Old user ID: ${mapping.oldUserId}`);
  console.log(`New user ID: ${mapping.newUserId}`);

  // Get all images from old site
  const oldImages = await sql<OldImage[]>`
    SELECT id, user_id, mode, prompt, style, input_image_url, output_image_url, r2_key, created_at
    FROM public.image_history
    WHERE user_id = ${mapping.oldUserId}
    ORDER BY created_at ASC
  `;

  console.log(`Found ${oldImages.length} images in old site`);

  // Get existing tasks to avoid duplicates
  const existingPrompts = await getExistingTaskPrompts(mapping.newUserId);
  console.log(`Found ${existingPrompts.size} existing tasks in new site`);

  let synced = 0;
  let skipped = 0;

  for (const img of oldImages) {
    // Check if already exists (by prompt and date)
    const key = `${img.prompt}|${new Date(img.created_at).toISOString().split('T')[0]}`;
    if (existingPrompts.has(key)) {
      skipped++;
      continue;
    }

    // Map old mode to new scene
    const scene = img.mode === 'image-to-image' ? 'image-to-image' : 'text-to-image';

    // Build task_info with image URL
    const taskInfo = {
      images: [{
        id: randomUUID(),
        createTime: img.created_at.toISOString(),
        imageType: 'image/png',
        imageUrl: img.output_image_url,
      }],
      status: 'success',
      createTime: img.created_at.toISOString(),
      // Store original r2_key for reference
      r2Key: img.r2_key,
      inputImageUrl: img.input_image_url,
    };

    // Build options (input image for image-to-image)
    const options = img.input_image_url
      ? { inputImage: img.input_image_url }
      : {};

    // Insert new task
    const newId = randomUUID();
    await sql`
      INSERT INTO nanobananastudio_new.ai_task (
        id, user_id, media_type, provider, model, prompt, options, status,
        created_at, updated_at, task_id, task_info, task_result, cost_credits, scene
      ) VALUES (
        ${newId},
        ${mapping.newUserId},
        'image',
        'gemini',
        'gemini-2.5-flash-image',
        ${img.prompt},
        ${JSON.stringify(options)},
        'success',
        ${img.created_at},
        ${img.created_at},
        ${'migrated-' + img.id},
        ${JSON.stringify(taskInfo)},
        '{}',
        0,
        ${scene}
      )
    `;

    synced++;
    console.log(`  Synced: ${img.prompt.substring(0, 40)}... (${img.created_at.toISOString().split('T')[0]})`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total images in old site: ${oldImages.length}`);
  console.log(`Synced: ${synced}`);
  console.log(`Skipped (already exist): ${skipped}`);
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: pnpm tsx scripts/migration/sync-user-images.ts <email>');
    console.log('Example: pnpm tsx scripts/migration/sync-user-images.ts wnfng.liu@gmail.com');
    process.exit(1);
  }

  try {
    await syncUserImages(email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

main();
