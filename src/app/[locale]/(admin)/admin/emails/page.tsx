import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  getEmails,
  getUnreadCount,
  Email,
  EmailDirection,
} from '@/shared/services/admin-email';
import { Crumb } from '@/shared/types/blocks/common';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MailOpen, Send, Inbox, RefreshCw } from 'lucide-react';

export default async function AdminEmailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    direction?: EmailDirection;
    search?: string;
  }>;
}) {
  const { locale } = await params;

  await requirePermission({
    code: PERMISSIONS.USERS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin');
  const { page: pageStr, direction, search } = await searchParams;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const limit = 20;

  const { emails, total } = await getEmails({
    direction,
    search,
    page,
    limit,
  });

  const unreadCount = await getUnreadCount();
  const totalPages = Math.ceil(total / limit);

  const crumbs: Crumb[] = [
    { title: 'Admin', url: '/admin' },
    { title: 'Emails', is_active: true },
  ];

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader title="Email Management" />

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">
                Emails awaiting response
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                All emails in system
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Link href="/admin/emails/compose">
                <Button size="sm" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Compose Email
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-4">
          <Link href="/admin/emails">
            <Button variant={!direction ? 'default' : 'outline'} size="sm">
              All
            </Button>
          </Link>
          <Link href="/admin/emails?direction=inbound">
            <Button
              variant={direction === 'inbound' ? 'default' : 'outline'}
              size="sm"
            >
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
            </Button>
          </Link>
          <Link href="/admin/emails?direction=outbound">
            <Button
              variant={direction === 'outbound' ? 'default' : 'outline'}
              size="sm"
            >
              <Send className="mr-2 h-4 w-4" />
              Sent
            </Button>
          </Link>
          <Link href="/admin/emails" className="ml-auto">
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Emails</CardTitle>
            <CardDescription>
              {direction === 'inbound'
                ? 'Incoming emails from customers'
                : direction === 'outbound'
                  ? 'Sent emails'
                  : 'All emails'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>From / To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No emails found
                    </TableCell>
                  </TableRow>
                ) : (
                  emails.map((email) => (
                    <TableRow
                      key={email.id}
                      className={!email.isRead ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        {email.direction === 'inbound' ? (
                          email.isRead ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mail className="h-4 w-4 text-blue-500" />
                          )
                        ) : (
                          <Send className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {email.direction === 'inbound'
                            ? email.fromName || email.fromEmail
                            : email.toName || email.toEmail}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {email.direction === 'inbound'
                            ? email.fromEmail
                            : email.toEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/emails/${email.id}`}
                          className="hover:underline"
                        >
                          <span className={!email.isRead ? 'font-semibold' : ''}>
                            {email.subject}
                          </span>
                        </Link>
                        {email.textContent && (
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {email.textContent.substring(0, 100)}...
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            email.status === 'received'
                              ? 'default'
                              : email.status === 'sent'
                                ? 'secondary'
                                : email.status === 'failed'
                                  ? 'destructive'
                                  : 'outline'
                          }
                        >
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(email.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {page > 1 && (
                  <Link
                    href={`/admin/emails?page=${page - 1}${direction ? `&direction=${direction}` : ''}`}
                  >
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                <span className="py-2 px-4 text-sm">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/admin/emails?page=${page + 1}${direction ? `&direction=${direction}` : ''}`}
                  >
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
