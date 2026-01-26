/**
 * Test R2 Storage Upload
 *
 * Run with: pnpm tsx scripts/test-r2-upload.ts
 */

import { db } from '../src/core/db';
import { config } from '../src/config/db/schema';
import { R2Provider } from '../src/extensions/storage/r2';

async function testR2Upload() {
  console.log('Testing R2 Storage Upload...\n');

  try {
    // Get configs directly from database
    const dbConfigs = await db().select().from(config);
    const configs: Record<string, string> = {};
    for (const c of dbConfigs) {
      configs[c.name] = c.value ?? '';
    }

    console.log('R2 Configuration from Database:');
    console.log('─'.repeat(60));
    console.log(`  r2_access_key: ${configs.r2_access_key ? configs.r2_access_key.slice(0, 10) + '...' : '(not set)'}`);
    console.log(`  r2_secret_key: ${configs.r2_secret_key ? configs.r2_secret_key.slice(0, 10) + '...' : '(not set)'}`);
    console.log(`  r2_bucket_name: ${configs.r2_bucket_name || '(not set)'}`);
    console.log(`  r2_account_id: ${configs.r2_account_id || '(not set)'}`);
    console.log(`  r2_endpoint: ${configs.r2_endpoint || '(not set)'}`);
    console.log(`  r2_domain: ${configs.r2_domain || '(not set)'}`);
    console.log(`  r2_upload_path: ${configs.r2_upload_path || '(not set)'}`);
    console.log('─'.repeat(60));

    // Check required configs
    if (!configs.r2_access_key || !configs.r2_secret_key || !configs.r2_bucket_name) {
      console.log('\n❌ Missing required R2 configuration!');
      console.log('   Required: r2_access_key, r2_secret_key, r2_bucket_name');
      process.exit(1);
    }

    // Create R2 provider
    const r2Provider = new R2Provider({
      accountId: configs.r2_account_id || '',
      accessKeyId: configs.r2_access_key,
      secretAccessKey: configs.r2_secret_key,
      bucket: configs.r2_bucket_name,
      uploadPath: configs.r2_upload_path || 'uploads',
      endpoint: configs.r2_endpoint,
      publicDomain: configs.r2_domain,
    });

    console.log('\nR2 Provider initialized');
    console.log(`  Endpoint: ${configs.r2_endpoint || `https://${configs.r2_account_id}.r2.cloudflarestorage.com`}`);
    console.log(`  Bucket: ${configs.r2_bucket_name}`);
    console.log(`  Upload Path: ${configs.r2_upload_path || 'uploads'}`);

    // Create a test image (small PNG - 1x1 red pixel)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');

    console.log(`\nTest image size: ${testImageBuffer.length} bytes`);

    // Generate unique key
    const timestamp = Date.now();
    const key = `test-upload-${timestamp}.png`;

    console.log(`Uploading to key: ${key}`);
    console.log('Please wait...\n');

    // Try upload
    const result = await r2Provider.uploadFile({
      body: testImageBuffer,
      key,
      contentType: 'image/png',
    });

    console.log('Upload Result:');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log('─'.repeat(60));

    if (result.success) {
      console.log('\n✅ Upload successful!');
      console.log(`   URL: ${result.url}`);
    } else {
      console.log('\n❌ Upload failed!');
      console.log(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed with exception:');
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

testR2Upload();
