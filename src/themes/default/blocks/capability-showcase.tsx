'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';

import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function CapabilityShowcase({
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container space-y-12 md:space-y-20">
        <ScrollAnimation>
          <div className="mx-auto max-w-3xl text-center text-balance">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Examples
            </div>

            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-muted-foreground text-lg">
                {section.description}
              </p>
            )}
          </div>
        </ScrollAnimation>

        {/* Showcase cards grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {section.items?.map((item, idx) => (
            <ScrollAnimation key={idx} delay={0.15 * idx}>
              <div
                className={cn(
                  'group relative h-full rounded-2xl overflow-hidden',
                  'bg-card/50 dark:bg-card/30',
                  'border border-border/50 dark:border-border/30',
                  'backdrop-blur-sm',
                  'transition-all duration-300 ease-out',
                  'hover:border-primary/30 hover:bg-card/80 dark:hover:bg-card/50'
                )}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image as unknown as string}
                    alt={item.title || ''}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  {/* Prompt */}
                  <div>
                    <span className="text-xs text-primary font-medium uppercase tracking-wider">
                      Prompt
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground italic line-clamp-2">
                      &ldquo;{item.prompt}&rdquo;
                    </p>
                  </div>

                  {/* Observations */}
                  {item.observations && (
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      {(item.observations as string[]).map(
                        (observation: string, obsIdx: number) => (
                          <div
                            key={obsIdx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-foreground/80">{observation}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
