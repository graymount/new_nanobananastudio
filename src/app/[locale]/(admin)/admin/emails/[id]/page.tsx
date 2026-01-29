import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import {
  getEmailById,
  getEmailThread,
  markEmailAsRead,
} from '@/shared/services/admin-email';
import { Crumb } from '@/shared/types/blocks/common';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Mail,
  MailOpen,
  Send,
  User,
  Clock,
  Paperclip,
} from 'lucide-react';

import { ReplyForm } from './reply-form';
import { EmailContent } from './email-content';

export default async function AdminEmailDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  await requirePermission({
    code: PERMISSIONS.USERS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin');
  const email = await getEmailById(id);

  if (!email) {
    notFound();
  }

  // Mark as read if inbound and unread
  if (email.direction === 'inbound' && !email.isRead) {
    await markEmailAsRead(id);
  }

  // Get thread emails if this is part of a conversation
  const threadEmails = email.threadId
    ? await getEmailThread(email.threadId)
    : [email];

  const crumbs: Crumb[] = [
    { title: 'Admin', url: '/admin' },
    { title: 'Emails', url: '/admin/emails' },
    { title: email.subject, is_active: true },
  ];

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <div className="mb-4">
          <Link href="/admin/emails">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Emails
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {email.direction === 'inbound' ? (
                  <div className="rounded-full bg-blue-100 p-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                ) : (
                  <div className="rounded-full bg-green-100 p-3">
                    <Send className="h-6 w-6 text-green-600" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl">{email.subject}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        email.direction === 'inbound' ? 'default' : 'secondary'
                      }
                    >
                      {email.direction === 'inbound' ? 'Received' : 'Sent'}
                    </Badge>
                    <Badge
                      variant={
                        email.status === 'received' || email.status === 'sent'
                          ? 'outline'
                          : email.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {email.status}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">
                    {email.fromName ? `${email.fromName} <${email.fromEmail}>` : email.fromEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">
                    {email.toName ? `${email.toName} <${email.toEmail}>` : email.toEmail}
                  </span>
                </div>
                {email.cc && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">CC:</span>
                    <span>{email.cc}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span>
                    {format(new Date(email.createdAt), 'PPpp')}
                  </span>
                </div>
                {email.messageId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Message ID:</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">
                      {email.messageId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {email.attachments && email.attachments.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({email.attachments.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {email.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-sm hover:bg-muted/80"
                      >
                        <Paperclip className="h-3 w-3" />
                        {att.filename}
                        <span className="text-muted-foreground">
                          ({Math.round(att.size / 1024)}KB)
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator className="my-4" />

            <EmailContent
              htmlContent={email.htmlContent}
              textContent={email.textContent}
            />
          </CardContent>
        </Card>

        {/* Thread History */}
        {threadEmails.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Conversation History</CardTitle>
              <CardDescription>
                {threadEmails.length} emails in this thread
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threadEmails
                  .filter((e) => e.id !== email.id)
                  .map((threadEmail) => (
                    <div
                      key={threadEmail.id}
                      className="border rounded-lg p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {threadEmail.direction === 'inbound' ? (
                            <MailOpen className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Send className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium">
                            {threadEmail.direction === 'inbound'
                              ? threadEmail.fromName || threadEmail.fromEmail
                              : `To: ${threadEmail.toName || threadEmail.toEmail}`}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(threadEmail.createdAt), 'PPp')}
                        </span>
                      </div>
                      <Link
                        href={`/admin/emails/${threadEmail.id}`}
                        className="text-sm hover:underline"
                      >
                        {threadEmail.subject}
                      </Link>
                      {threadEmail.textContent && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {threadEmail.textContent.substring(0, 150)}...
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reply Form - Only for inbound emails */}
        {email.direction === 'inbound' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reply</CardTitle>
              <CardDescription>
                Reply to {email.fromName || email.fromEmail}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReplyForm emailId={email.id} defaultFromEmail={email.toEmail} />
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  );
}
