/**
 * Check User Roles Script
 *
 * Run with: pnpm tsx scripts/check-user-roles.ts --email=user@example.com
 * Or: pnpm tsx scripts/check-user-roles.ts --name="Mount liu"
 */

import { eq, like } from 'drizzle-orm';
import { db } from '../src/core/db';
import { user } from '../src/config/db/schema';
import { getUserRoles, hasPermission } from '../src/shared/services/rbac';
import { PERMISSIONS } from '../src/core/rbac/permission';

async function checkUserRoles() {
  const args = process.argv.slice(2);
  const emailArg = args.find((arg) => arg.startsWith('--email='));
  const nameArg = args.find((arg) => arg.startsWith('--name='));

  try {
    let targetUser;

    if (emailArg) {
      const email = emailArg.split('=')[1];
      console.log(`🔍 Looking up user by email: ${email}\n`);
      const [foundUser] = await db()
        .select()
        .from(user)
        .where(eq(user.email, email));
      targetUser = foundUser;
    } else if (nameArg) {
      const name = nameArg.split('=')[1];
      console.log(`🔍 Looking up user by name: ${name}\n`);
      const [foundUser] = await db()
        .select()
        .from(user)
        .where(like(user.name, `%${name}%`));
      targetUser = foundUser;
    } else {
      // List all users
      console.log('Listing all users...\n');
      const users = await db().select().from(user).limit(20);
      console.log('Users in database:');
      console.log('─'.repeat(60));
      for (const u of users) {
        console.log(`  ID: ${u.id}`);
        console.log(`  Name: ${u.name || '(no name)'}`);
        console.log(`  Email: ${u.email}`);
        console.log('─'.repeat(60));
      }
      process.exit(0);
    }

    if (!targetUser) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('User Found:');
    console.log('─'.repeat(60));
    console.log(`  ID: ${targetUser.id}`);
    console.log(`  Name: ${targetUser.name}`);
    console.log(`  Email: ${targetUser.email}`);
    console.log('─'.repeat(60));

    // Get roles
    console.log('\nRoles:');
    const roles = await getUserRoles(targetUser.id);
    if (roles.length === 0) {
      console.log('  ❌ No roles assigned');
    } else {
      for (const role of roles) {
        console.log(`  ✓ ${role.title} (${role.name})`);
      }
    }

    // Check admin permission
    console.log('\nAdmin Access Check:');
    const hasAdminAccess = await hasPermission(
      targetUser.id,
      PERMISSIONS.ADMIN_ACCESS
    );
    console.log(
      `  admin.access: ${hasAdminAccess ? '✓ Granted' : '❌ Denied'}`
    );

    const hasSettingsRead = await hasPermission(
      targetUser.id,
      PERMISSIONS.SETTINGS_READ
    );
    console.log(
      `  settings.read: ${hasSettingsRead ? '✓ Granted' : '❌ Denied'}`
    );

    const hasSettingsWrite = await hasPermission(
      targetUser.id,
      PERMISSIONS.SETTINGS_WRITE
    );
    console.log(
      `  settings.write: ${hasSettingsWrite ? '✓ Granted' : '❌ Denied'}`
    );

    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

checkUserRoles();
