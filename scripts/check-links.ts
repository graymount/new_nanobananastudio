/**
 * Link Checker Script
 * Run with: npx tsx scripts/check-links.ts
 *
 * Checks all internal links in the locale message files
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://new.nanobananastudio.com';

// Valid internal routes based on the app structure
const validRoutes = [
  '/',
  '/pricing',
  '/blog',
  '/showcases',
  '/updates',
  '/docs',
  '/settings',
  '/settings/billing',
  '/settings/profile',
  '/settings/security',
  '/settings/credits',
  '/settings/apikeys',
  '/activity',
  '/activity/ai-tasks',
  '/activity/feedbacks',
  '/activity/chats',
  '/admin',
  '/sign-in',
  '/sign-up',
  '/privacy-policy',
  '/terms-of-service',
  '/ai-image-generator',
  '/ai-music-generator',
  '/ai-video-generator',
];

// Anchor links that are valid
const validAnchors = [
  '/#features',
  '/#usage',
  '/#pricing',
  '/#faq',
  '/#showcases',
];

interface LinkCheckResult {
  file: string;
  url: string;
  status: 'valid' | 'invalid' | 'external';
  reason?: string;
}

function extractUrls(obj: any, urls: string[] = []): string[] {
  if (typeof obj === 'string') {
    // Check if it looks like a URL
    if (obj.startsWith('/') || obj.startsWith('http')) {
      urls.push(obj);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractUrls(item, urls));
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach(value => extractUrls(value, urls));
  }
  return urls;
}

function checkLink(url: string): LinkCheckResult['status'] {
  // External links
  if (url.startsWith('http')) {
    return 'external';
  }

  // Mailto links
  if (url.startsWith('mailto:')) {
    return 'external';
  }

  // Anchor links
  if (validAnchors.includes(url)) {
    return 'valid';
  }

  // Internal routes
  const cleanUrl = url.split('#')[0].split('?')[0];
  if (validRoutes.includes(cleanUrl)) {
    return 'valid';
  }

  // Blog post pattern
  if (cleanUrl.match(/^\/blog\/[\w-]+$/)) {
    return 'valid';
  }

  // Blog category pattern
  if (cleanUrl.match(/^\/blog\/category\/[\w-]+$/)) {
    return 'valid';
  }

  return 'invalid';
}

async function main() {
  const messagesDir = path.join(process.cwd(), 'src/config/locale/messages');
  const results: LinkCheckResult[] = [];

  // Read all JSON files recursively
  function readJsonFiles(dir: string): void {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        readJsonFiles(filePath);
      } else if (file.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          const urls = extractUrls(content);

          for (const url of urls) {
            const status = checkLink(url);
            results.push({
              file: filePath.replace(process.cwd(), ''),
              url,
              status,
            });
          }
        } catch (error) {
          console.error(`Error reading ${filePath}:`, error);
        }
      }
    }
  }

  readJsonFiles(messagesDir);

  // Print results
  console.log('\n🔗 Link Check Results\n');
  console.log('='.repeat(60));

  const invalid = results.filter(r => r.status === 'invalid');
  const valid = results.filter(r => r.status === 'valid');
  const external = results.filter(r => r.status === 'external');

  console.log(`\n✅ Valid internal links: ${valid.length}`);
  console.log(`🔗 External links: ${external.length}`);
  console.log(`❌ Invalid links: ${invalid.length}`);

  if (invalid.length > 0) {
    console.log('\n❌ Invalid Links Found:\n');
    invalid.forEach(r => {
      console.log(`  File: ${r.file}`);
      console.log(`  URL: ${r.url}`);
      console.log('');
    });
  }

  console.log('\n🔗 External Links:\n');
  const uniqueExternal = [...new Set(external.map(r => r.url))];
  uniqueExternal.forEach(url => {
    console.log(`  ${url}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total links checked: ${results.length}`);

  if (invalid.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
