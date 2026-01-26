import { R2Provider, S3Provider, StorageManager } from '@/extensions/storage';
import { Configs, getAllConfigs } from '@/shared/models/config';
import { db } from '@/core/db';
import { config } from '@/config/db/schema';

/**
 * Directly fetch configs from database (bypasses Next.js cache)
 * Used as fallback when cached configs are empty
 */
async function getConfigsDirectFromDb(): Promise<Configs> {
  try {
    const dbConfigs = await db().select().from(config);
    const configs: Configs = {};
    for (const c of dbConfigs) {
      configs[c.name] = c.value ?? '';
    }
    return configs;
  } catch (e) {
    console.error('[Storage] Failed to fetch configs directly from database:', e);
    return {};
  }
}

/**
 * get storage service with configs
 */
export function getStorageServiceWithConfigs(configs: Configs) {
  const storageManager = new StorageManager();

  // Add R2 provider if configured
  if (
    configs.r2_access_key &&
    configs.r2_secret_key &&
    configs.r2_bucket_name
  ) {
    console.log('[Storage] R2 provider configured with bucket:', configs.r2_bucket_name);
    // r2_region in settings stores the Cloudflare Account ID
    // For R2, region is typically "auto" but can be customized
    const accountId = configs.r2_account_id || '';

    storageManager.addProvider(
      new R2Provider({
        accountId: accountId,
        accessKeyId: configs.r2_access_key,
        secretAccessKey: configs.r2_secret_key,
        bucket: configs.r2_bucket_name,
        uploadPath: configs.r2_upload_path,
        region: 'auto', // R2 uses "auto" as region
        endpoint: configs.r2_endpoint, // Optional custom endpoint
        publicDomain: configs.r2_domain,
      }),
      true // Set R2 as default
    );
  }

  // Add S3 provider if configured (future support)
  if (configs.s3_access_key && configs.s3_secret_key && configs.s3_bucket) {
    storageManager.addProvider(
      new S3Provider({
        endpoint: configs.s3_endpoint,
        region: configs.s3_region,
        accessKeyId: configs.s3_access_key,
        secretAccessKey: configs.s3_secret_key,
        bucket: configs.s3_bucket,
        publicDomain: configs.s3_domain,
      })
    );
  }

  // Warn if no storage provider is configured
  if (!storageManager.hasProvider()) {
    console.warn('[Storage] WARNING: No storage provider configured!', {
      r2_access_key: !!configs.r2_access_key,
      r2_secret_key: !!configs.r2_secret_key,
      r2_bucket_name: !!configs.r2_bucket_name,
      s3_access_key: !!configs.s3_access_key,
      s3_secret_key: !!configs.s3_secret_key,
      s3_bucket: !!configs.s3_bucket,
    });
  }

  return storageManager;
}

/**
 * global storage service
 */
let storageService: StorageManager | null = null;

/**
 * get storage service instance
 */
export async function getStorageService(
  configs?: Configs
): Promise<StorageManager> {
  if (!configs) {
    configs = await getAllConfigs();
  }

  // If no R2 config found (possibly due to cache issues), try direct DB fetch
  if (!configs.r2_access_key && !configs.s3_access_key) {
    console.log('[Storage] No storage config found in cached configs, fetching directly from database...');
    const directConfigs = await getConfigsDirectFromDb();

    // Merge with existing configs (direct DB configs take precedence for storage)
    if (directConfigs.r2_access_key || directConfigs.s3_access_key) {
      console.log('[Storage] Found storage config in direct DB fetch');
      configs = { ...configs, ...directConfigs };
    }
  }

  storageService = getStorageServiceWithConfigs(configs);

  return storageService;
}
