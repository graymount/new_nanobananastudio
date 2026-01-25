import { Link } from '@/core/i18n/navigation';
import { HomeGenerator } from '@/shared/blocks/generator/home-generator';
import { Highlighter } from '@/shared/components/ui/highlighter';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function HeroGenerator({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const highlightText = section.highlight_text ?? '';
  let texts = null;
  if (highlightText) {
    texts = section.title?.split(highlightText, 2);
  }

  return (
    <section
      id={section.id}
      className={cn(
        'pt-24 pb-12 md:pt-32 md:pb-16',
        section.className,
        className
      )}
    >
      <div className="container">
        {/* Title & Description */}
        <div className="mx-auto max-w-4xl text-center mb-8">
          {texts && texts.length > 0 ? (
            <h1 className="text-foreground text-3xl font-semibold text-balance sm:text-5xl md:text-6xl">
              {texts[0]}
              <Highlighter action="underline" color="#FF9800">
                {highlightText}
              </Highlighter>
              {texts[1]}
            </h1>
          ) : (
            <h1 className="text-foreground text-3xl font-semibold text-balance sm:text-5xl md:text-6xl">
              {section.title}
            </h1>
          )}

          {/* Description - content from locale JSON is developer-controlled */}
          <p
            className="text-muted-foreground mt-6 text-lg text-balance"
            dangerouslySetInnerHTML={{ __html: section.description ?? '' }}
          />
        </div>

        {/* Generator */}
        <HomeGenerator className="mt-8" />

        {/* Tip - content from locale JSON is developer-controlled */}
        {section.tip && (
          <p
            className="text-muted-foreground mt-8 block text-center text-sm"
            dangerouslySetInnerHTML={{ __html: section.tip ?? '' }}
          />
        )}
      </div>
    </section>
  );
}
