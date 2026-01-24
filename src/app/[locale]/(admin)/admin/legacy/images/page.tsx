import Image from 'next/image';
import { sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { requireAdminAccess } from '@/core/rbac/permission';
import { Header, Main, MainHeader } from '@/shared/blocks/dashboard';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Crumb } from '@/shared/types/blocks/common';

interface LegacyImage {
  id: string;
  user_email: string | null;
  mode: string | null;
  prompt: string | null;
  style: string | null;
  input_image_url: string | null;
  output_image_url: string | null;
  created_at: string;
}

export default async function LegacyImagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: number;
    pageSize?: number;
    email?: string;
    mode?: string;
  }>;
}) {
  const { locale } = await params;

  await requireAdminAccess({
    redirectUrl: `/no-permission`,
    locale,
  });

  const { page: pageNum, pageSize, email, mode } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;
  const offset = (page - 1) * limit;

  const database = db();

  // Get total count
  const countResult = await database.execute(sql`
    SELECT COUNT(*) as count
    FROM public.image_history ih
    JOIN public.users u ON ih.user_id = u.id
    WHERE 1=1
    ${email ? sql`AND u.email ILIKE ${'%' + email + '%'}` : sql``}
    ${mode ? sql`AND ih.mode = ${mode}` : sql``}
  `);
  const total = Number(countResult[0]?.count || 0);

  // Get images with user info
  const images = await database.execute(sql`
    SELECT
      ih.id,
      u.email as user_email,
      ih.mode,
      ih.prompt,
      ih.style,
      ih.input_image_url,
      ih.output_image_url,
      ih.created_at
    FROM public.image_history ih
    JOIN public.users u ON ih.user_id = u.id
    WHERE 1=1
    ${email ? sql`AND u.email ILIKE ${'%' + email + '%'}` : sql``}
    ${mode ? sql`AND ih.mode = ${mode}` : sql``}
    ORDER BY ih.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as LegacyImage[];

  // Get mode stats
  const modeStats = await database.execute(sql`
    SELECT mode, COUNT(*) as count
    FROM public.image_history
    GROUP BY mode
    ORDER BY count DESC
  `) as { mode: string; count: number }[];

  const crumbs: Crumb[] = [
    { title: 'Admin', url: '/admin' },
    { title: 'Legacy Images', is_active: true },
  ];

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Header crumbs={crumbs} />
      <Main>
        <MainHeader
          title="Legacy Site Images"
          description={`Total: ${total} generated images from the old site`}
          search={{
            name: 'email',
            title: 'Search by email',
            placeholder: 'Filter by user email...',
            value: email,
          }}
        />

        {/* Mode Stats */}
        <div className="mb-6 flex flex-wrap gap-2">
          <a href="/admin/legacy/images">
            <Badge variant={!mode ? 'default' : 'outline'} className="cursor-pointer">
              All ({total})
            </Badge>
          </a>
          {modeStats.map((stat) => (
            <a key={stat.mode} href={`/admin/legacy/images?mode=${stat.mode}`}>
              <Badge
                variant={mode === stat.mode ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {stat.mode} ({stat.count})
              </Badge>
            </a>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden">
              <div className="relative aspect-square">
                {img.output_image_url ? (
                  <Image
                    src={img.output_image_url}
                    alt={img.prompt || 'Generated image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    No image
                  </div>
                )}
              </div>
              <CardHeader className="p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {img.mode}
                  </Badge>
                  {img.style && (
                    <Badge variant="secondary" className="text-xs">
                      {img.style}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs truncate">
                  {img.user_email}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {img.prompt || 'No prompt'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(img.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {page > 1 && (
              <a
                href={`/admin/legacy/images?page=${page - 1}${email ? `&email=${email}` : ''}${mode ? `&mode=${mode}` : ''}`}
                className="px-4 py-2 border rounded hover:bg-accent"
              >
                Previous
              </a>
            )}
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`/admin/legacy/images?page=${page + 1}${email ? `&email=${email}` : ''}${mode ? `&mode=${mode}` : ''}`}
                className="px-4 py-2 border rounded hover:bg-accent"
              >
                Next
              </a>
            )}
          </div>
        )}
      </Main>
    </>
  );
}
