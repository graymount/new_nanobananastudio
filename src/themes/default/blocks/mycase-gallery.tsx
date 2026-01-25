'use client';

import { UserImageGallery } from '@/shared/blocks/gallery/user-image-gallery';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function MycaseGallery({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <UserImageGallery
      className={cn(section.className, className)}
      title={section.title}
      description={section.description}
    />
  );
}
