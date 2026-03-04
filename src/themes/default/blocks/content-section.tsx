'use client';

import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function ContentSection({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section
      id={section.id}
      className={cn('py-20 md:py-32 relative overflow-hidden', section.className, className)}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container space-y-10 md:space-y-14">
        <ScrollAnimation>
          <div className="mx-auto max-w-3xl text-center text-balance">
            {/* Optional badge */}
            {section.badge && (
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {section.badge as string}
              </div>
            )}

            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {section.title}
            </h2>
            {/* Description - developer-controlled content from locale JSON, safe for innerHTML */}
            <p
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ __html: section.description ?? '' }}
            />
          </div>
        </ScrollAnimation>

        {/* Bullet list in cosmic card */}
        {section.items && section.items.length > 0 && (
          <ScrollAnimation delay={0.2}>
            <div
              className={cn(
                'mx-auto max-w-3xl p-6 md:p-8 rounded-2xl',
                'bg-card/50 dark:bg-card/30',
                'border border-border/50 dark:border-border/30',
                'backdrop-blur-sm'
              )}
            >
              <div className="space-y-5">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1.5">
                      <span className="block w-2 h-2 rounded-full bg-primary/60" />
                    </div>
                    <div>
                      <span className="text-foreground font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-muted-foreground"> — {item.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollAnimation>
        )}

        {/* Optional closing tip - developer-controlled content from locale JSON */}
        {section.tip && (
          <ScrollAnimation delay={0.3}>
            <p
              className="text-center text-muted-foreground text-sm max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ __html: section.tip ?? '' }}
            />
          </ScrollAnimation>
        )}
      </div>
    </section>
  );
}
