#!/usr/bin/env node
// Applies the database changes in supabase/migrations (and, the first time, supabase/seed.sql)
// to your hosted Supabase project. Safe to run again: changes already applied are skipped.
//
// Usage, from the project root:
//   node --env-file=.env.local scripts/setup-database.mjs
//
// Asks for the database password (input hidden); it is passed straight to the Supabase CLI and
// never saved. Needs SUPABASE_URL in .env.local. SUPABASE_DB_HOST is the connection pooler
// address shown in Supabase under Connect > Session pooler.

import { askHidden } from './lib/prompt.mjs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'node_modules', 'supabase', 'dist', 'supabase.js');

const projectUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const projectRef = projectUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
const host = process.env.SUPABASE_DB_HOST || 'aws-0-ap-south-1.pooler.supabase.com';
const withSeed = !process.argv.includes('--no-seed');

if (!projectRef) {
  console.error('SUPABASE_URL is missing or not a supabase.co address. Check .env.local.');
  process.exit(1);
}


const password = process.env.SUPABASE_DB_PASSWORD || (await askHidden('Database password (input hidden): '));
if (!password) {
  console.error('No password entered.');
  process.exit(1);
}

const dbUrl = `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${host}:5432/postgres`;
const args = [cli, 'db', 'push', '--db-url', dbUrl, '--yes', ...(withSeed ? ['--include-seed'] : [])];

console.log(`Applying database changes to project ${projectRef}${withSeed ? ' (with seed data)' : ''}…`);
const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });

if (result.status === 0) {
  console.log('\nDatabase is up to date.');
} else {
  console.error(
    '\nSomething went wrong (see above). "password authentication failed" means the password was wrong;' +
      ' you can reset it in Supabase under Project Settings > Database.'
  );
}
process.exit(result.status ?? 1);
