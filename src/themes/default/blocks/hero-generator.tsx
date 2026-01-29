'use client';

import { useEffect, useState } from 'react';

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
  const [mounted, setMounted] = useState(false);
  const highlightText = section.highlight_text ?? '';
  let texts = null;
  if (highlightText) {
    texts = section.title?.split(highlightText, 2);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id={section.id}
      className={cn(
        'relative min-h-[90vh] pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden',
        section.className,
        className
      )}
    >
      {/* Cosmic Background Effects */}
      <div className="absolute inset-0 -z-10">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-cosmic opacity-60" />

        {/* Floating orbs - GPU accelerated */}
        <div
          className="cosmic-orb cosmic-orb-purple w-[500px] h-[500px] -top-48 -left-48"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="cosmic-orb cosmic-orb-blue w-[400px] h-[400px] top-1/3 -right-32"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="cosmic-orb cosmic-orb-cyan w-[300px] h-[300px] bottom-0 left-1/4"
          style={{ animationDelay: '4s' }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay opacity-50" />
      </div>

      <div className="container relative">
        {/* Title & Description */}
        <div
          className={cn(
            'mx-auto max-w-4xl text-center mb-8',
            mounted && 'animate-in-1'
          )}
        >
          {/* Decorative badge */}
          <div
            className={cn(
              'inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full',
              'bg-primary/10 dark:bg-primary/20 border border-primary/20',
              'text-sm font-medium text-primary',
              mounted && 'animate-in-1'
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Powered by Advanced AI
          </div>

          {texts && texts.length > 0 ? (
            <h1
              className={cn(
                'text-foreground text-4xl font-bold text-balance sm:text-5xl md:text-6xl lg:text-7xl',
                'tracking-tight leading-[1.1]',
                mounted && 'animate-in-2'
              )}
            >
              {texts[0]}
              <span className="text-gradient-cosmic-static">{highlightText}</span>
              {texts[1]}
            </h1>
          ) : (
            <h1
              className={cn(
                'text-foreground text-4xl font-bold text-balance sm:text-5xl md:text-6xl lg:text-7xl',
                'tracking-tight leading-[1.1]',
                mounted && 'animate-in-2'
              )}
            >
              {section.title}
            </h1>
          )}

          {/* Description - content from locale JSON is developer-controlled */}
          <p
            className={cn(
              'text-muted-foreground mt-6 text-lg md:text-xl text-balance max-w-2xl mx-auto',
              mounted && 'animate-in-3'
            )}
            dangerouslySetInnerHTML={{ __html: section.description ?? '' }}
          />
        </div>

        {/* Generator with cosmic styling */}
        <div
          className={cn(
            'mt-10 relative',
            mounted && 'animate-in-4'
          )}
        >
          {/* Glow effect behind generator */}
          <div className="absolute inset-0 -z-10 blur-3xl opacity-20 dark:opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple via-cosmic-blue to-cosmic-cyan rounded-3xl" />
          </div>

          <HomeGenerator className="relative" />
        </div>

        {/* Tip - content from locale JSON is developer-controlled */}
        {section.tip && (
          <p
            className={cn(
              'mt-8 block text-center text-sm',
              'text-muted-foreground/80',
              'flex items-center justify-center gap-2',
              mounted && 'animate-in-5'
            )}
          >
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span dangerouslySetInnerHTML={{ __html: section.tip ?? '' }} />
          </p>
        )}

      </div>
    </section>
  );
}
