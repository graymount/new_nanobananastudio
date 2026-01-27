'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

const STORAGE_KEY = 'classic-banner-dismissed';

export function ClassicVersionBanner() {
  const t = useTranslations('app.classic_banner');
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== 'true') {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border-b border-yellow-500/30">
      <div className="container py-2.5">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('text')}</span>
          <a
            href="https://nanobananastudio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
          >
            {t('link')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2 hover:bg-yellow-500/20"
            onClick={handleDismiss}
            aria-label={t('dismiss')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
