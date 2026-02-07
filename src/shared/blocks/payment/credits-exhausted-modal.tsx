'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/components/ui/drawer';
import { useAppContext } from '@/shared/contexts/app';
import { useMediaQuery } from '@/shared/hooks/use-media-query';

interface UserImage {
  id: string;
  imageUrl: string;
  prompt: string;
}

function CreditsExhaustedContent({
  onUpgrade,
}: {
  onUpgrade: () => void;
}) {
  const t = useTranslations('common.credits_exhausted');
  const [images, setImages] = useState<UserImage[]>([]);

  useEffect(() => {
    fetch('/api/user/images?page=1&limit=4')
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0 && res.data?.images) {
          setImages(res.data.images.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {images.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-3 text-sm">
            {t('your_creations')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-muted aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={img.imageUrl}
                  alt={img.prompt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={onUpgrade}
        className="w-full"
        size="lg"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {t('upgrade_button')}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        {t('starter_hint')}
      </p>
    </div>
  );
}

export function CreditsExhaustedModal() {
  const t = useTranslations('common.credits_exhausted');
  const locale = useLocale();
  const { isShowCreditsExhaustedModal, setIsShowCreditsExhaustedModal } =
    useAppContext();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const handleUpgrade = () => {
    setIsShowCreditsExhaustedModal(false);
    window.location.href = `/${locale}/pricing`;
  };

  if (isDesktop) {
    return (
      <Dialog
        open={isShowCreditsExhaustedModal}
        onOpenChange={setIsShowCreditsExhaustedModal}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <CreditsExhaustedContent onUpgrade={handleUpgrade} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={isShowCreditsExhaustedModal}
      onOpenChange={setIsShowCreditsExhaustedModal}
    >
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description')}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <CreditsExhaustedContent onUpgrade={handleUpgrade} />
        </div>
        <DrawerFooter className="pt-4">
          <DrawerClose asChild>
            <Button variant="outline">{t('maybe_later')}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
