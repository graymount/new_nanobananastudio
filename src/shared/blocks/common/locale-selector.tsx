'use client';

import { useEffect, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLocale } from 'next-intl';

import { usePathname, useRouter } from '@/core/i18n/navigation';
import { localeNames, locales } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cacheSet } from '@/shared/lib/cache';

// Helper to strip locale prefix from pathname
function stripLocalePrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0 && locales.includes(segments[0])) {
    return '/' + segments.slice(1).join('/') || '/';
  }
  return path;
}

export function LocaleSelector({
  type = 'icon',
}: {
  type?: 'icon' | 'button';
}) {
  const currentLocale = useLocale();
  const router = useRouter();
  const rawPathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Ensure pathname doesn't contain locale prefix
  const pathname = stripLocalePrefix(rawPathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSwitchLanguage = (value: string) => {
    if (value !== currentLocale) {
      // Update localStorage to sync with locale detector
      cacheSet('locale', value);
      router.push(pathname, {
        locale: value,
      });
    }
  };

  // Return a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant={type === 'icon' ? 'ghost' : 'outline'}
        size={type === 'icon' ? 'icon' : 'sm'}
        className={
          type === 'icon' ? 'h-auto w-auto p-0' : 'hover:bg-primary/10'
        }
        disabled
      >
        {type === 'icon' ? (
          <Globe size={18} />
        ) : (
          <>
            <Globe size={16} />
            {localeNames[currentLocale]}
          </>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {type === 'icon' ? (
          <Button variant="ghost" size="icon" className="h-auto w-auto p-0">
            <Globe size={18} />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="hover:bg-primary/10">
            <Globe size={16} />
            {localeNames[currentLocale]}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.keys(localeNames).map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleSwitchLanguage(locale)}
          >
            <span>{localeNames[locale]}</span>
            {locale === currentLocale && (
              <Check size={16} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
