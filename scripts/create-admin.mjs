#!/usr/bin/env node
// Creates an admin account, or promotes an existing account to admin.
//
// Usage, from the project root:
//   node --env-file=.env.local scripts/create-admin.mjs you@example.com "Your Name"
//
// The password is taken from ADMIN_PASSWORD if set; otherwise you are asked for it (input hidden).
// On first sign-in the admin console asks the new admin to set up an authenticator app.
// Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY, as in .env.example.

import { askHidden } from './lib/prompt.mjs';
import { createClient } from '@supabase/supabase-js';

const MIN_PASSWORD_LENGTH = 12;

const [email, fullName = ''] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs you@example.com "Your Name"');
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secretKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });


async function findUserIdByEmail(address) {
  const wanted = address.toLowerCase();
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((u) => (u.email || '').toLowerCase() === wanted);
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
}

let userId = await findUserIdByEmail(email);

if (userId) {
  console.log('That account already exists. Promoting it to admin (password unchanged).');
} else {
  const password = process.env.ADMIN_PASSWORD || (await askHidden(`Password (at least ${MIN_PASSWORD_LENGTH} characters): `));
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    console.error(`Could not create the account: ${error.message}`);
    process.exit(1);
  }
  userId = data.user.id;
  console.log('Account created.');
}

const updates = { role: 'admin', ...(fullName ? { full_name: fullName } : {}) };
const { error: roleError } = await supabase.from('profiles').update(updates).eq('id', userId);
if (roleError) {
  console.error(`Could not set the admin role: ${roleError.message}`);
  process.exit(1);
}

console.log(`${email} is now an admin. Sign in at /admin/login to set up two-step verification.`);
