import { getTranslations } from 'next-intl/server';
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
import { ArrowLeft } from 'lucide-react';

import { ComposeForm } from './compose-form';

export default async function AdminEmailComposePage({
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

  const t = await getTranslations('admin');

  const crumbs: Crumb[] = [
    { title: 'Admin', url: '/admin' },
    { title: 'Emails', url: '/admin/emails' },
    { title: 'Compose', is_active: true },
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

        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Send a new email to a customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComposeForm />
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
