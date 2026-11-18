// Generate VAPID keys for Web Push
// Run with: npx tsx scripts/generate-vapid.ts

import { generateVAPIDKeys } from 'web-push';

const keys = generateVAPIDKeys();

console.log('VAPID Keys Generated:');
console.log('=====================');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('');
console.log('Add these to your .env.local file:');
console.log('');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:your-email@example.com`);
console.log('');
console.log('For Supabase Edge Functions, add as secrets:');
console.log(`supabase secrets set VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`supabase secrets set VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`supabase secrets set VAPID_SUBJECT=mailto:your-email@example.com`);