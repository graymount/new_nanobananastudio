import Link from 'next/link';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main } from '@/shared/blocks/dashboard';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Crumb } from '@/shared/types/blocks/common';
import { ArrowLeft, Users, Mail } from 'lucide-react';
import { getUsersCount } from '@/shared/models/user';

import { BroadcastForm } from './broadcast-form';

export default async function AdminEmailBroadcastPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  await requirePermission({
    code: PERMISSIONS.USERS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const totalUsers = await getUsersCount({});

  const crumbs: Crumb[] = [
    { title: 'Admin', url: '/admin' },
    { title: 'Emails', url: '/admin/emails' },
    { title: 'CEO Broadcast', is_active: true },
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

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                registered users will receive this email
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sender</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Alex King, CEO</div>
              <p className="text-xs text-muted-foreground">
                alex.king@nanobananastudio.com
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">📢</span>
              CEO Broadcast Email
            </CardTitle>
            <CardDescription>
              Send a message from the CEO to all registered users. This email will be sent to {totalUsers} users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BroadcastForm totalUsers={totalUsers} />
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
