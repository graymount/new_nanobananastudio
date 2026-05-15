/**
 * Grant Credits to User Script
 *
 * Usage:
 *   npx tsx scripts/grant-credits.ts --email=user@example.com --credits=50
 *   npx tsx scripts/grant-credits.ts --email=user@example.com --credits=50 --description="manual test grant"
 */

import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { user } from '@/config/db/schema';
import { grantCreditsForUser, getRemainingCredits } from '@/shared/models/credit';

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='));
  const creditsArg = args.find((a) => a.startsWith('--credits='));
  const descArg = args.find((a) => a.startsWith('--description='));

  if (!emailArg || !creditsArg) {
    console.error('Missing required args.');
    console.log(
      'Usage: npx tsx scripts/grant-credits.ts --email=<email> --credits=<n> [--description=<text>]'
    );
    process.exit(1);
  }

  const email = emailArg.split('=')[1];
  const credits = parseInt(creditsArg.split('=')[1], 10);
  const description = descArg ? descArg.split('=').slice(1).join('=') : 'manual grant';

  if (!Number.isFinite(credits) || credits <= 0) {
    console.error('--credits must be a positive integer');
    process.exit(1);
  }

  const [target] = await db().select().from(user).where(eq(user.email, email));
  if (!target) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const before = await getRemainingCredits(target.id);
  console.log(`User: ${target.name || '(no name)'} <${target.email}>`);
  console.log(`Remaining credits before: ${before}`);

  await grantCreditsForUser({
    user: target,
    credits,
    description,
  });

  const after = await getRemainingCredits(target.id);
  console.log(`Granted: ${credits}`);
  console.log(`Remaining credits after: ${after}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
