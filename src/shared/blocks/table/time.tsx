import { format, formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, zhCN, es, ja, ko } from 'date-fns/locale';
import { useLocale } from 'next-intl';

const localeMap: Record<string, Locale> = {
  en: enUS,
  zh: zhCN,
  es: es,
  ja: ja,
  ko: ko,
};

export function Time({
  value,
  placeholder,
  metadata,
  className,
}: {
  value: string | Date;
  placeholder?: string;
  metadata?: Record<string, any>;
  className?: string;
}) {
  if (!value) {
    if (placeholder) {
      return <div className={className}>{placeholder}</div>;
    }

    return null;
  }

  const locale = useLocale();
  const dateLocale = localeMap[locale] || enUS;
  const date = new Date(value);

  return (
    <div className={className}>
      {metadata?.format
        ? format(date, metadata.format, { locale: dateLocale })
        : formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })}
    </div>
  );
}
