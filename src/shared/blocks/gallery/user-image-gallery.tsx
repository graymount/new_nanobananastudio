'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImageIcon,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { LazyImage } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';

interface UserImage {
  id: string;
  taskId: string;
  imageUrl: string;
  prompt: string;
  model: string;
  provider: string;
  createdAt: string;
}

interface UserImageGalleryProps {
  className?: string;
  title?: string;
  description?: string;
}

export function UserImageGallery({
  className,
  title,
  description,
}: UserImageGalleryProps) {
  const t = useTranslations('pages.mycase.gallery');
  const { user, isCheckSign, setIsShowSignModal } = useAppContext();

  const [isMounted, setIsMounted] = useState(false);
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user images
  const fetchImages = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const resp = await fetch(`/api/user/images?page=${page}&limit=${limit}`);
      if (!resp.ok) throw new Error('Failed to fetch images');

      const { code, data } = await resp.json();
      if (code !== 0) throw new Error('Failed to fetch images');

      setImages(data.images);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      toast.error(t('fetch_error'));
    } finally {
      setIsLoading(false);
    }
  }, [user, page, t]);

  useEffect(() => {
    if (user) {
      fetchImages();
    } else if (!isCheckSign) {
      setIsLoading(false);
    }
  }, [user, isCheckSign, fetchImages]);

  // Keyboard navigation
  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null ? (prev === 0 ? images.length - 1 : prev - 1) : null
    );
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null ? (prev === images.length - 1 ? 0 : prev + 1) : null
    );
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handlePrevious, handleNext]);

  // Download image
  const handleDownload = async (image: UserImage) => {
    try {
      const resp = await fetch(
        `/api/proxy/file?url=${encodeURIComponent(image.imageUrl)}`
      );
      if (!resp.ok) throw new Error('Failed to fetch image');

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nano-banana-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      toast.success(t('downloaded'));
    } catch (error) {
      toast.error(t('download_error'));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Server-side or initial mount - show loading
  if (!isMounted) {
    return (
      <section className={cn('py-24 md:py-36', className)}>
        <div className="container text-center">
          <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
          <p className="text-muted-foreground mt-4">{t('loading')}</p>
        </div>
      </section>
    );
  }

  // Not logged in state
  if (!isCheckSign && !user) {
    return (
      <section className={cn('py-24 md:py-36', className)}>
        <motion.div
          className="container text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
            {title || t('title')}
          </h2>
          <p className="text-muted-foreground text-md mx-auto mb-8 max-w-2xl">
            {description || t('description')}
          </p>

          <div className="bg-card/50 mx-auto max-w-md rounded-2xl border p-8 backdrop-blur-sm">
            <ImageIcon className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold">{t('sign_in_title')}</h3>
            <p className="text-muted-foreground mb-6">{t('sign_in_desc')}</p>
            <Button onClick={() => setIsShowSignModal(true)} size="lg">
              {t('sign_in_button')}
            </Button>
          </div>
        </motion.div>
      </section>
    );
  }

  // Loading state
  if (isLoading || isCheckSign) {
    return (
      <section className={cn('py-24 md:py-36', className)}>
        <div className="container text-center">
          <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
          <p className="text-muted-foreground mt-4">{t('loading')}</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <section className={cn('py-24 md:py-36', className)}>
        <motion.div
          className="container text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
            {title || t('title')}
          </h2>
          <p className="text-muted-foreground text-md mx-auto mb-8 max-w-2xl">
            {description || t('description')}
          </p>

          <div className="bg-card/50 mx-auto max-w-md rounded-2xl border p-8 backdrop-blur-sm">
            <ImageIcon className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold">{t('empty_title')}</h3>
            <p className="text-muted-foreground mb-6">{t('empty_desc')}</p>
            <Button asChild size="lg">
              <Link href="/app">{t('create_button')}</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className={cn('py-24 md:py-36', className)}>
      {/* Header */}
      <motion.div
        className="container mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
          {title || t('title')}
        </h2>
        <p className="text-muted-foreground text-md mx-auto mb-4 max-w-2xl">
          {description || t('description')}
        </p>
        <p className="text-muted-foreground text-sm">
          {t('total_images', { count: total })}
        </p>
      </motion.div>

      {/* Image Grid - Masonry Layout */}
      <div className="container mx-auto columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            className="group relative cursor-zoom-in break-inside-avoid overflow-hidden rounded-xl"
            onClick={() => setSelectedIndex(index)}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.6,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ scale: 1.02 }}
          >
            <LazyImage
              src={image.imageUrl}
              alt={image.prompt}
              className="h-auto w-full transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="line-clamp-2 translate-y-4 text-sm text-white transition-transform duration-300 group-hover:translate-y-0">
                {image.prompt}
              </p>
              <p className="text-muted mt-2 translate-y-4 text-xs text-white/70 transition-transform delay-75 duration-300 group-hover:translate-y-0">
                {formatDate(image.createdAt)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          className="container mt-12 flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t('prev')}
          </Button>
          <span className="text-muted-foreground text-sm">
            {t('page_info', { current: page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {t('next')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm md:p-8"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-50 text-white/70 transition-colors hover:text-white"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="size-8" />
            </button>

            {/* Previous button */}
            <button
              className="absolute top-1/2 left-4 z-50 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/40 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
            >
              <ChevronLeft className="size-8 md:size-12" />
            </button>

            {/* Next button */}
            <button
              className="absolute top-1/2 right-4 z-50 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/40 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="size-8 md:size-12" />
            </button>

            {/* Image container */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative flex h-full w-full items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-h-full max-w-full overflow-hidden rounded-lg">
                <LazyImage
                  src={images[selectedIndex].imageUrl}
                  alt={images[selectedIndex].prompt}
                  className="h-auto max-h-[90vh] w-auto max-w-full object-contain"
                />
                {/* Info overlay */}
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 text-white">
                  <p className="mb-2 line-clamp-3 text-base text-white/90">
                    {images[selectedIndex].prompt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/70">
                      <span>{images[selectedIndex].model}</span>
                      <span className="mx-2">·</span>
                      <span>{formatDate(images[selectedIndex].createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/app?ref_image=${encodeURIComponent(images[selectedIndex].imageUrl)}`}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          {t('edit_with_this')}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(images[selectedIndex]);
                        }}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        {t('download')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
