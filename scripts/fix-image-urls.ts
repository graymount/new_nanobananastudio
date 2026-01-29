/**
 * Fix migrated image URLs - replace old domain with new CDN domain
 *
 * Old domain: images.nanobananastudio.com (DNS not working)
 * New domain: cdn.nanobananastudio.com (working)
 *
 * Usage:
 *   DRY_RUN=true npx tsx scripts/fix-image-urls.ts   # Preview changes
 *   DRY_RUN=false npx tsx scripts/fix-image-urls.ts  # Apply changes
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load env
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const DB_SCHEMA = process.env.DB_SCHEMA || 'public';
const DRY_RUN = process.env.DRY_RUN !== 'false';

const OLD_DOMAIN = 'images.nanobananastudio.com';
const NEW_DOMAIN = 'cdn.nanobananastudio.com';

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  console.log('=== Fix Migrated Image URLs ===\n');
  console.log(`Old domain: ${OLD_DOMAIN}`);
  console.log(`New domain: ${NEW_DOMAIN}`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  try {
    // Count affected records
    const countResult = await sql`
      SELECT COUNT(*) as count
      FROM "${sql.unsafe(DB_SCHEMA)}".ai_task
      WHERE task_info LIKE ${'%' + OLD_DOMAIN + '%'}
    `;
    const affectedCount = countResult[0]?.count || 0;
    console.log(`Found ${affectedCount} records with old domain\n`);

    if (affectedCount === 0) {
      console.log('No records to update.');
      return;
    }

    if (DRY_RUN) {
      // Show sample of what would be changed
      const samples = await sql`
        SELECT id, user_id, task_info
        FROM "${sql.unsafe(DB_SCHEMA)}".ai_task
        WHERE task_info LIKE ${'%' + OLD_DOMAIN + '%'}
        LIMIT 3
      `;

      console.log('Sample records that would be updated:\n');
      for (const sample of samples) {
        console.log('---');
        console.log('Task ID:', sample.id);
        console.log('User ID:', sample.user_id);
        console.log('Before:', sample.task_info.substring(0, 150) + '...');
        console.log(
          'After: ',
          sample.task_info.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN).substring(0, 150) +
            '...'
        );
      }

      console.log('\n=== DRY RUN - No changes made ===');
      console.log('To apply changes, run: DRY_RUN=false npx tsx scripts/fix-image-urls.ts');
    } else {
      // Perform the update
      console.log('Updating records...');

      const result = await sql`
        UPDATE "${sql.unsafe(DB_SCHEMA)}".ai_task
        SET task_info = REPLACE(task_info, ${OLD_DOMAIN}, ${NEW_DOMAIN})
        WHERE task_info LIKE ${'%' + OLD_DOMAIN + '%'}
      `;

      console.log(`\nUpdated ${affectedCount} records.`);

      // Verify
      const verifyResult = await sql`
        SELECT COUNT(*) as count
        FROM "${sql.unsafe(DB_SCHEMA)}".ai_task
        WHERE task_info LIKE ${'%' + OLD_DOMAIN + '%'}
      `;
      const remaining = verifyResult[0]?.count || 0;
      console.log(`Remaining records with old domain: ${remaining}`);

      if (remaining === 0) {
        console.log('\nAll records updated successfully!');
      }
    }
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
