import { sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { requireAdminAccess } from '@/core/rbac/permission';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { Badge } from '@/shared/components/ui/badge';
import { Crumb } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

interface LegacyUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  plan: string | null;
  quota_left: number | null;
  expires_at: string | null;
  image_count: number;
}

export default async function LegacyUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: number;
    pageSize?: number;
    email?: string;
  }>;
}) {
  const { locale } = await params;

  await requireAdminAccess({
    redirectUrl: `/no-permission`,
    locale,
  });

  const { page: pageNum, pageSize, email } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;
  const offset = (page - 1) * limit;

  const database = db();

  // Get total count
  const countResult = await database.execute(sql`
    SELECT COUNT(*) as count FROM public.users
    ${email ? sql`WHERE email ILIKE ${'%' + email + '%'}` : sql``}
  `);
  const total = Number(countResult[0]?.count || 0);

  // Get users with usage info and image count
  const users = await database.execute(sql`
    SELECT
      u.id,
      u.email,
      u.name,
      u.avatar_url,
      u.created_at,
      us.plan,
      us.quota_left,
      us.expires_at,
      COALESCE(ic.image_count, 0) as image_count
    FROM public.users u
    LEFT JOIN public.usage us ON u.id = us.user_id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as image_count
      FROM public.image_history
      GROUP BY user_id
    ) ic ON u.id = ic.user_id
    ${email ? sql`WHERE u.email ILIKE ${'%' + email + '%'}` : sql``}
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as LegacyUser[];

  const crumbs: Crumb[] = [
    { title: 'Admin', url: '/admin' },
    { title: 'Legacy Users', is_active: true },
  ];

  const table: Table = {
    columns: [
      { name: 'id', title: 'ID', type: 'copy' },
      { name: 'name', title: 'Name' },
      {
        name: 'avatar_url',
        title: 'Avatar',
        type: 'image',
        placeholder: '-',
      },
      { name: 'email', title: 'Email', type: 'copy' },
      {
        name: 'plan',
        title: 'Plan',
        callback: (item: LegacyUser) => (
          <Badge variant={item.plan === 'pro' ? 'default' : 'outline'}>
            {item.plan || 'free'}
          </Badge>
        ),
      },
      { name: 'quota_left', title: 'Quota Left' },
      {
        name: 'image_count',
        title: 'Images',
        callback: (item: LegacyUser) => (
          <span className="text-blue-500 font-medium">{item.image_count}</span>
        ),
      },
      { name: 'created_at', title: 'Created At', type: 'time' },
      {
        name: 'expires_at',
        title: 'Expires At',
        type: 'time',
        placeholder: '-',
      },
    ],
    data: users,
    pagination: {
      total,
      page,
      limit,
    },
  };

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader
          title="Legacy Site Users"
          description={`Total: ${total} users from the old nanobananastudio.com`}
          search={{
            name: 'email',
            title: 'Search by email',
            placeholder: 'Enter email...',
            value: email,
          }}
        />
        <div className="mb-4 grid grid-cols-4 gap-4">
          <StatCard title="Total Users" value={total.toString()} />
          <StatCard
            title="Pro Users"
            value={users.filter((u) => u.plan === 'pro').length.toString()}
          />
          <StatCard
            title="Total Images"
            value={users.reduce((sum, u) => sum + Number(u.image_count), 0).toString()}
          />
        </div>
        <TableCard table={table} />
      </Main>
    </>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
