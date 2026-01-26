'use client';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Features({
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
            {/* Section label */}
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Features
            </div>

            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {section.title}
            </h2>
            <p className="text-muted-foreground text-lg">
              {section.description}
            </p>
          </div>
        </ScrollAnimation>

        <div className="relative">
          {/* Feature cards grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.items?.map((item, idx) => (
              <ScrollAnimation key={idx} delay={0.1 * idx}>
                <div
                  className={cn(
                    'group relative h-full p-6 rounded-2xl',
                    'bg-card/50 dark:bg-card/30',
                    'border border-border/50 dark:border-border/30',
                    'backdrop-blur-sm',
                    'transition-all duration-300 ease-out',
                    'hover:border-primary/30 hover:bg-card/80 dark:hover:bg-card/50',
                    'cosmic-card'
                  )}
                >
                  {/* Gradient hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Icon container */}
                  <div className={cn(
                    'relative w-12 h-12 mb-4 rounded-xl',
                    'flex items-center justify-center',
                    'bg-gradient-to-br from-primary/10 to-primary/5',
                    'border border-primary/20',
                    'group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20',
                    'transition-all duration-300'
                  )}>
                    <SmartIcon
                      name={item.icon as string}
                      size={24}
                      className="text-primary"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative space-y-2">
                    <h3 className="text-foreground text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
