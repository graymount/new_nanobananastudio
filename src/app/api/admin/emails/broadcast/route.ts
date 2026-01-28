import { NextResponse } from 'next/server';

import { PERMISSIONS } from '@/core/rbac';
import { getUserInfo, getAllUsersForBroadcast, getUsersCount } from '@/shared/models/user';
import { sendBroadcastEmail } from '@/shared/services/admin-email';
import { hasPermission } from '@/shared/services/rbac';

/**
 * GET - Get total user count for broadcast preview
 */
export async function GET() {
  try {
    const user = await getUserInfo();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const permitted = await hasPermission(user.id, PERMISSIONS.USERS_READ);
    if (!permitted) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const totalUsers = await getUsersCount({});

    return NextResponse.json({
      success: true,
      totalUsers,
    });
  } catch (error) {
    console.error('Broadcast count error:', error);
    return NextResponse.json(
      { error: 'Failed to get user count' },
      { status: 500 }
    );
  }
}

/**
 * POST - Send broadcast email to all users
 */
export async function POST(req: Request) {
  try {
    const user = await getUserInfo();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    const permitted = await hasPermission(user.id, PERMISSIONS.USERS_READ);
    if (!permitted) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { fromEmail, subject, textContent, htmlContent } = body;

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!textContent && !htmlContent) {
      return NextResponse.json(
        { error: 'Email content is required' },
        { status: 400 }
      );
    }

    // Get all users
    const userEmails = await getAllUsersForBroadcast();

    if (userEmails.length === 0) {
      return NextResponse.json(
        { error: 'No users found to send emails to' },
        { status: 400 }
      );
    }

    // Send broadcast
    const result = await sendBroadcastEmail(
      {
        fromEmail,
        subject,
        textContent,
        htmlContent,
      },
      userEmails
    );

    return NextResponse.json({
      success: result.success,
      totalUsers: result.totalUsers,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      errors: result.errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error('Broadcast email error:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast email' },
      { status: 500 }
    );
  }
}
