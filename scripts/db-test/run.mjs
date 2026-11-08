#!/usr/bin/env node
// Runs the database tests without Docker: applies supabase/migrations and supabase/seed.sql to an
// in-memory Postgres (PGlite), then runs supabase/tests/database.test.sql.
//
// Usage: npm run test:db
//
// supabase-stubs.sql stands in for the parts of Supabase the migration relies on (API roles,
// auth.uid()/auth.jwt(), auth.users, storage tables), and pgtap-shim.sql provides the few pgTAP
// functions the test file uses. `npx supabase test db` runs the same file against the real stack.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const supabaseDir = path.join(root, 'supabase');
const read = (file) => readFile(file, 'utf8');

const db = new PGlite({ extensions: { btree_gist } });

function explain(error, sql) {
  let text = error.message;
  if (error.position) {
    const at = Number(error.position);
    text += `\n  near: ${sql.slice(Math.max(0, at - 120), at + 60).replace(/\s+/g, ' ')}`;
  }
  return text;
}

async function apply(label, sql) {
  try {
    await db.exec(sql);
  } catch (error) {
    console.error(`Failed to apply ${label}: ${explain(error, sql)}`);
    process.exit(1);
  }
}

await db.exec('set search_path = public, extensions');
await apply('Supabase stand-ins', await read(path.join(here, 'supabase-stubs.sql')));

const migrations = (await readdir(path.join(supabaseDir, 'migrations'))).filter((f) => f.endsWith('.sql')).sort();
for (const file of migrations) {
  await apply(`migration ${file}`, await read(path.join(supabaseDir, 'migrations', file)));
}
await apply('seed.sql', await read(path.join(supabaseDir, 'seed.sql')));
await apply('pgTAP stand-in', await read(path.join(here, 'pgtap-shim.sql')));
console.log(`# applied ${migrations.length} migration(s) and the seed`);

const testSql = (await read(path.join(supabaseDir, 'tests', 'database.test.sql'))).replace(
  /^create extension if not exists pgtap.*$/m,
  '-- pgTAP is provided by scripts/db-test/pgtap-shim.sql'
);

let results;
try {
  results = await db.exec(testSql);
} catch (error) {
  console.error(`The test file stopped with an error: ${explain(error, testSql)}`);
  process.exit(1);
}

let failed = 0;
for (const result of results) {
  for (const row of result.rows ?? []) {
    for (const value of Object.values(row)) {
      if (typeof value === 'string' && /^(ok|not ok|1\.\.|#)/.test(value)) {
        console.log(value);
        if (value.startsWith('not ok')) failed += 1;
        if (value.startsWith('# Looks like you planned')) failed += 1;
      }
    }
  }
}

process.exit(failed ? 1 : 0);
