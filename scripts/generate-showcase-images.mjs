#!/usr/bin/env node
/**
 * Generate showcase images for the homepage using Gemini API.
 * These images demonstrate text rendering capabilities.
 *
 * Usage: node scripts/generate-showcase-images.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load .env
const envContent = readFileSync(resolve(ROOT, '.env'), 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1)];
    })
);

const API_KEY = env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY not found in .env');
  process.exit(1);
}

const MODEL = 'gemini-3-pro-image-preview';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const SHOWCASES = [
  {
    name: 'neon-poster',
    filename: 'neon-poster.png',
    prompt: `Generate a futuristic cyberpunk poster image. The poster features large, glowing neon text that reads "TOKYO 2077" at the top. Below the title text, there's a neon cityscape with tall buildings and holographic signs. The color palette is purple, cyan, and pink neon lights against a dark background. The text must be perfectly spelled and clearly readable. High quality, cinematic poster layout.`,
  },
  {
    name: 'brand-logo',
    filename: 'brand-logo.png',
    prompt: `Generate a minimalist brand logo design on a clean white background. The logo features elegant serif typography spelling "Aurora Coffee" as the main text. Above the text is a simple, stylish coffee cup icon with a small aurora/northern lights motif rising from it. The color scheme is warm brown and gold tones. The text must be perfectly spelled, centered, and clearly readable. Professional branding quality, suitable for a premium coffee shop identity.`,
  },
  {
    name: 'product-ad',
    filename: 'product-ad.png',
    prompt: `Generate a luxury product advertisement for a high-end watch. The image shows an elegant wristwatch on a dark marble surface with dramatic lighting. At the top of the image, there is clean white text that reads "Timeless Precision" in a sophisticated serif font. The overall aesthetic is premium, dark, and luxurious with subtle gold accents. The text must be perfectly spelled and clearly readable against the dark background. Magazine advertisement quality.`,
  },
];

async function generateImage(showcase) {
  console.log(`\nGenerating: ${showcase.name}...`);
  console.log(`Prompt: ${showcase.prompt.slice(0, 80)}...`);

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: showcase.prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  // Extract image from response
  const candidate = result.candidates?.[0];
  if (!candidate) {
    throw new Error('No candidates in response');
  }

  const parts = candidate.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);

  if (!imagePart) {
    console.log('Response parts:', JSON.stringify(parts.map(p => Object.keys(p)), null, 2));
    throw new Error('No image in response');
  }

  const { mimeType, data } = imagePart.inlineData;
  const buffer = Buffer.from(data, 'base64');
  const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const outputPath = resolve(ROOT, 'public/imgs/showcases', showcase.filename.replace('.png', `.${ext}`));

  writeFileSync(outputPath, buffer);
  console.log(`Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return outputPath;
}

async function main() {
  console.log('Generating showcase images for homepage...');
  console.log(`Model: ${MODEL}`);
  console.log(`Output: public/imgs/showcases/\n`);

  const results = [];
  for (const showcase of SHOWCASES) {
    try {
      const path = await generateImage(showcase);
      results.push({ name: showcase.name, path, success: true });
    } catch (err) {
      console.error(`Failed to generate ${showcase.name}:`, err.message);
      results.push({ name: showcase.name, success: false, error: err.message });
    }
  }

  console.log('\n--- Results ---');
  for (const r of results) {
    console.log(`${r.success ? '✓' : '✗'} ${r.name}${r.success ? '' : ': ' + r.error}`);
  }
}

main().catch(console.error);
