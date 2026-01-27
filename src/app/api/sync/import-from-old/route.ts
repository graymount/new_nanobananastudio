/**
 * User Self-Import API
 *
 * Allows users to import their data from the old site.
 * This is useful for users who registered after the main migration
 * or if some data was missed during migration.
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

import { respData, respErr } from '@/shared/lib/resp';
import { createAITask } from '@/shared/models/ai_task';
import { grantCreditsForUser } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';

// Old site configuration (set these in environment variables)
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL || '';
const OLD_SUPABASE_ANON_KEY = process.env.OLD_SUPABASE_ANON_KEY || '';
const OLD_R2_DOMAIN =
  process.env.OLD_R2_DOMAIN || 'https://images.nanobananastudio.com';

interface OldImageHistory {
  id: number;
  user_id: string;
  mode: string;
  prompt: string | null;
  style: string | null;
  r2_key: string | null;
  output_image_url: string | null;
  created_at: string;
}

interface OldUsage {
  id: string;
  user_id: string;
  plan: string;
  quota_left: number;
  expires_at: string | null;
}

interface ImportResult {
  success: boolean;
  imagesImported: number;
  creditsImported: number;
  message: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Check if old site configuration is available
    if (!OLD_SUPABASE_URL || !OLD_SUPABASE_ANON_KEY) {
      return respErr('Import feature is not configured');
    }

    // 2. Get current user
    const user = await getUserInfo();
    if (!user) {
      return respErr('Please sign in first');
    }

    // 3. Create old site client
    const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY);

    // 4. Find user in old site by email
    const { data: oldUsers, error: userError } = await oldClient
      .from('users')
      .select('id, email, google_sub')
      .ilike('email', user.email)
      .limit(1);

    if (userError) {
      console.error('Failed to query old site:', userError);
      return respErr('Failed to connect to old site');
    }

    if (!oldUsers || oldUsers.length === 0) {
      return respData({
        success: true,
        imagesImported: 0,
        creditsImported: 0,
        message: 'No data found in old site for your email',
      } as ImportResult);
    }

    const oldUser = oldUsers[0];
    const result: ImportResult = {
      success: true,
      imagesImported: 0,
      creditsImported: 0,
      message: '',
    };

    // 5. Import image history
    const { data: oldImages, error: imagesError } = await oldClient
      .from('image_history')
      .select('id, user_id, mode, prompt, style, r2_key, output_image_url, created_at')
      .eq('user_id', oldUser.id)
      .order('created_at', { ascending: false })
      .limit(1000); // Limit to prevent abuse

    if (imagesError) {
      console.error('Failed to fetch old images:', imagesError);
    } else if (oldImages && oldImages.length > 0) {
      for (const img of oldImages as OldImageHistory[]) {
        try {
          // Build image URL
          let imageUrl: string | null = null;
          if (img.r2_key) {
            imageUrl = `${OLD_R2_DOMAIN}/${img.r2_key}`;
          } else if (img.output_image_url?.startsWith('http')) {
            imageUrl = img.output_image_url;
          }

          if (!imageUrl) continue;

          // Map scene
          const scene =
            img.mode === 'image_edit' || img.mode === 'image-edit'
              ? 'image-to-image'
              : 'text-to-image';

          // Create AI task
          await createAITask({
            id: randomUUID(),
            userId: user.id,
            mediaType: 'image',
            provider: 'gemini',
            model: 'gemini-2.5-flash-image',
            prompt: img.prompt || '',
            scene,
            options: JSON.stringify({
              style: img.style,
              imported_from: 'old_site',
              original_id: img.id,
              imported_at: new Date().toISOString(),
            }),
            status: 'success',
            taskId: `imported-${img.id}`,
            taskInfo: JSON.stringify({
              images: [
                {
                  imageUrl,
                  createTime: img.created_at,
                },
              ],
              status: 'SUCCESS',
            }),
            costCredits: 0, // No cost for imported images
          });

          result.imagesImported++;
        } catch (error) {
          console.error(`Failed to import image ${img.id}:`, error);
          // Continue with other images
        }
      }
    }

    // 6. Import remaining credits (only if not expired)
    const { data: oldUsage, error: usageError } = await oldClient
      .from('usage')
      .select('id, user_id, plan, quota_left, expires_at')
      .eq('user_id', oldUser.id)
      .single();

    if (usageError) {
      console.error('Failed to fetch old usage:', usageError);
    } else if (oldUsage) {
      const usage = oldUsage as OldUsage;
      const expiresAt = usage.expires_at ? new Date(usage.expires_at) : null;
      const isExpired = expiresAt && expiresAt < new Date();

      if (usage.quota_left > 0 && !isExpired) {
        try {
          // Calculate valid days from expiry date
          const validDays = expiresAt
            ? Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 30; // Default to 30 days if no expiry

          await grantCreditsForUser({
            user: user as any, // Session user has compatible fields
            credits: usage.quota_left,
            validDays,
            description: `Imported from old site (${usage.plan} plan)`,
          });

          result.creditsImported = usage.quota_left;
        } catch (error) {
          console.error('Failed to import credits:', error);
        }
      }
    }

    // 7. Build result message
    const parts: string[] = [];
    if (result.imagesImported > 0) {
      parts.push(`${result.imagesImported} images`);
    }
    if (result.creditsImported > 0) {
      parts.push(`${result.creditsImported} credits`);
    }

    if (parts.length > 0) {
      result.message = `Successfully imported ${parts.join(' and ')} from old site`;
    } else {
      result.message = 'No new data to import (already imported or no data found)';
    }

    return respData(result);
  } catch (error: any) {
    console.error('Import failed:', error);
    return respErr(error.message || 'Import failed');
  }
}

// Check if user has data in old site (for showing import button)
export async function GET(request: Request): Promise<Response> {
  try {
    if (!OLD_SUPABASE_URL || !OLD_SUPABASE_ANON_KEY) {
      return respData({ hasOldData: false, available: false });
    }

    const user = await getUserInfo();
    if (!user) {
      return respErr('Please sign in first');
    }

    const oldClient = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY);

    // Check if user exists in old site
    const { data: oldUsers, error } = await oldClient
      .from('users')
      .select('id')
      .ilike('email', user.email)
      .limit(1);

    if (error || !oldUsers || oldUsers.length === 0) {
      return respData({ hasOldData: false, available: true });
    }

    // Check if user has images or credits
    const oldUserId = oldUsers[0].id;

    const [imagesResult, usageResult] = await Promise.all([
      oldClient
        .from('image_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', oldUserId),
      oldClient
        .from('usage')
        .select('quota_left, expires_at')
        .eq('user_id', oldUserId)
        .single(),
    ]);

    const imageCount = imagesResult.count || 0;
    const usage = usageResult.data;
    const hasActiveCredits =
      usage &&
      usage.quota_left > 0 &&
      (!usage.expires_at || new Date(usage.expires_at) > new Date());

    return respData({
      hasOldData: imageCount > 0 || hasActiveCredits,
      available: true,
      imageCount,
      creditsAvailable: hasActiveCredits ? usage.quota_left : 0,
    });
  } catch (error: any) {
    console.error('Check old data failed:', error);
    return respData({ hasOldData: false, available: false });
  }
}
