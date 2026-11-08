#!/usr/bin/env node
// Uploads the listing photos in partner_frontend/public/images to the "property-images"
// storage bucket, at the same paths supabase/seed.sql refers to
// (for example pinewood-manor/media_1790249276700.jpg). Safe to run more than once.
//
// Usage, from the project root:
//   node --env-file=.env.local scripts/upload-listing-photos.mjs
//
// Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY (the secret or
// service-role key). Never put the secret key in a VITE_ variable: those end up in the website.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'property-images';
const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imagesDir = path.join(root, 'partner_frontend', 'public', 'images');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secretKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

let folders;
try {
  folders = await readdir(imagesDir, { withFileTypes: true });
} catch {
  console.error(`No photos found at ${imagesDir}`);
  process.exit(1);
}

let uploaded = 0;
let failed = 0;

for (const folder of folders) {
  if (!folder.isDirectory()) continue;
  for (const file of await readdir(path.join(imagesDir, folder.name))) {
    const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()];
    if (!contentType) continue;

    const objectPath = `${folder.name}/${file}`;
    const body = await readFile(path.join(imagesDir, folder.name, file));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, body, { contentType, upsert: true, cacheControl: '31536000' });

    if (error) {
      failed += 1;
      console.error(`x ${objectPath}: ${error.message}`);
    } else {
      uploaded += 1;
      console.log(`ok ${objectPath}`);
    }
  }
}

console.log(`\nUploaded ${uploaded} photo(s)${failed ? `, ${failed} failed` : ''}.`);
process.exit(failed ? 1 : 0);
