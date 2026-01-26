/**
 * Initialize Creem.io payment configuration
 *
 * Run with: pnpm tsx scripts/init-creem-config.ts
 */

import { saveConfigs } from '../src/shared/models/config';

async function initCreemConfig() {
  console.log('Initializing Creem.io payment configuration...\n');

  const creemConfigs = {
    // Enable Creem payment
    creem_enabled: 'true',

    // Environment: 'sandbox' for testing, 'production' for live
    creem_environment: 'production',

    // API Key from Creem dashboard
    creem_api_key: 'creem_5xOIeZqFTWYqe0Wr2ufMN5',

    // Webhook signing secret for verifying webhooks
    creem_signing_secret: 'whsec_JwetZkfQ90wF1z1a8vysH',

    // Product ID mapping: local product_id -> Creem product_id
    // Format: JSON object { "local_id": "creem_product_id" }
    creem_product_ids: JSON.stringify({
      pro: 'prod_1Hy0FSUxG6AI22FAXEkScn',
      max: 'prod_4bHtNuUGiDat7I2DdOmEbZ',
    }),

    // Set Creem as default payment provider
    default_payment_provider: 'creem',
  };

  try {
    await saveConfigs(creemConfigs);

    console.log('✅ Creem configuration saved successfully!\n');
    console.log('Configuration summary:');
    console.log('─'.repeat(50));
    console.log(`  creem_enabled:          ${creemConfigs.creem_enabled}`);
    console.log(`  creem_environment:      ${creemConfigs.creem_environment}`);
    console.log(`  creem_api_key:          ${creemConfigs.creem_api_key.slice(0, 15)}...`);
    console.log(`  creem_signing_secret:   ${creemConfigs.creem_signing_secret.slice(0, 15)}...`);
    console.log(`  creem_product_ids:      ${creemConfigs.creem_product_ids}`);
    console.log(`  default_payment_provider: ${creemConfigs.default_payment_provider}`);
    console.log('─'.repeat(50));
    console.log('\n📝 Next steps:');
    console.log('1. Verify config in Admin: /admin/settings/payment');
    console.log('2. After domain switch, update Webhook URL in Creem dashboard');
    console.log('3. Test a payment flow');

  } catch (error) {
    console.error('❌ Failed to save Creem configuration:', error);
    process.exit(1);
  }

  process.exit(0);
}

initCreemConfig();
