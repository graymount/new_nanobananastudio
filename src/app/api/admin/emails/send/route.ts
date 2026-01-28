import { NextResponse } from 'next/server';

import { PERMISSIONS } from '@/core/rbac';
import { getUserInfo } from '@/shared/models/user';
import { sendNewEmail } from '@/shared/services/admin-email';
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
    const { toEmail, toName, subject, textContent, htmlContent } = body;

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

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

    const result = await sendNewEmail({
      toEmail,
      toName,
      subject,
      textContent,
      htmlContent,
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
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
