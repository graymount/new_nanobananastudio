import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PERMISSIONS, requirePermission } from '@/core/rbac';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { TableCard } from '@/shared/blocks/table';
import { getAITasks, getAITasksCount } from '@/shared/models/ai_task';
import { findUserById } from '@/shared/models/user';
import { Crumb, Tab } from '@/shared/types/blocks/common';
import { type Table } from '@/shared/types/blocks/table';

export default async function UserCreationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ page?: number; pageSize?: number; type?: string }>;
}) {
  const { locale, id: userId } = await params;
  setRequestLocale(locale);

  // Check if user has permission to read users
  await requirePermission({
    code: PERMISSIONS.USERS_READ,
    redirectUrl: '/admin/no-permission',
    locale,
  });

  const t = await getTranslations('admin.ai-tasks');
  const tUsers = await getTranslations('admin.users');

  // Get user info
  const user = await findUserById(userId);
  if (!user) {
    return <div>User not found</div>;
  }

  const { page: pageNum, pageSize, type } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 30;

  const crumbs: Crumb[] = [
    { title: tUsers('list.crumbs.admin'), url: '/admin' },
    { title: tUsers('list.crumbs.users'), url: '/admin/users' },
    { title: user.email || user.name || userId, is_active: false },
    { title: t('list.crumbs.ai-tasks'), is_active: true },
  ];

  const total = await getAITasksCount({
    userId,
    mediaType: type,
  });

  const aiTasks = await getAITasks({
    userId,
    page,
    limit,
    mediaType: type,
  });

  const table: Table = {
    columns: [
      { name: 'id', title: t('fields.task_id'), type: 'copy' },
      { name: 'createdAt', title: t('fields.created_at'), type: 'time' },
      { name: 'status', title: t('fields.status'), type: 'label' },
      { name: 'costCredits', title: t('fields.cost_credits'), type: 'label' },
      { name: 'mediaType', title: t('fields.media_type'), type: 'label' },
      { name: 'scene', title: t('fields.scene'), type: 'label' },
      { name: 'provider', title: t('fields.provider'), type: 'label' },
      { name: 'model', title: t('fields.model'), type: 'label' },
      { name: 'prompt', title: t('fields.prompt'), type: 'copy' },
      { name: 'taskResult', title: t('fields.result'), type: 'json_preview' },
    ],
    data: aiTasks,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const baseUrl = `/admin/users/${userId}/creations`;
  const tabs: Tab[] = [
    {
      title: t('list.tabs.all'),
      name: 'all',
      url: baseUrl,
      is_active: !type || type === 'all',
    },
    {
      title: t('list.tabs.image'),
      name: 'image',
      url: `${baseUrl}?type=image`,
      is_active: type === 'image',
    },
    {
      title: t('list.tabs.music'),
      name: 'music',
      url: `${baseUrl}?type=music`,
      is_active: type === 'music',
    },
    {
      title: t('list.tabs.video'),
      name: 'video',
      url: `${baseUrl}?type=video`,
      is_active: type === 'video',
    },
  ];

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader
          title={`${user.name || user.email} - ${t('list.title')}`}
          tabs={tabs}
        />
        <TableCard table={table} />
      </Main>
    </>
  );
}
