import { NextResponse } from 'next/server';

import { PERMISSIONS } from '@/core/rbac';
import { getUserInfo } from '@/shared/models/user';
import { sendReplyEmail } from '@/shared/services/admin-email';
import { hasPermission } from '@/shared/services/rbac';

export async function POST(req: Request) {
  try {
    const user = await getUserInfo();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permission
    const permitted = await hasPermission(user.id, PERMISSIONS.USERS_READ);
    if (!permitted) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { parentId, textContent, htmlContent, fromEmail } = body;

    if (!parentId) {
      return NextResponse.json(
        { error: 'Parent email ID is required' },
        { status: 400 }
      );
    }

    if (!textContent && !htmlContent) {
      return NextResponse.json(
        { error: 'Email content is required' },
        { status: 400 }
      );
    }

    const result = await sendReplyEmail({
      parentId,
      textContent,
      htmlContent,
      fromEmail,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        email: result.email,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email reply error:', error);
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    );
  }
}
