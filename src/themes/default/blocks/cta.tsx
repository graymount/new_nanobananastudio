'use client';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Cta({
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
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-cosmic opacity-30" />

        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] opacity-30" />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl">
          {/* Decorative elements */}
          <div className="flex justify-center mb-8">
            <ScrollAnimation>
              <div className="relative">
                {/* Animated rings */}
                <div className="absolute inset-0 animate-ping">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/30" />
                </div>
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/30">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </ScrollAnimation>
          </div>

          <div className="text-center">
            <ScrollAnimation>
              <h2 className="text-4xl font-bold text-balance lg:text-5xl xl:text-6xl">
                <span className="text-gradient-cosmic-static">{section.title}</span>
              </h2>
            </ScrollAnimation>

            <ScrollAnimation delay={0.15}>
              {/* Description - content from locale JSON is developer-controlled, safe for dangerouslySetInnerHTML */}
              <p
                className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
                dangerouslySetInnerHTML={{ __html: section.description ?? '' }}
              />
            </ScrollAnimation>

            <ScrollAnimation delay={0.3}>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                {section.buttons?.map((button, idx) => (
                  <Button
                    asChild
                    size="lg"
                    variant={button.variant || 'default'}
                    key={idx}
                    className={cn(
                      'group relative px-8 py-6 text-base font-medium',
                      'overflow-hidden',
                      button.variant !== 'outline' && [
                        'bg-gradient-to-r from-primary to-primary/80',
                        'hover:from-primary/90 hover:to-primary/70',
                        'shadow-lg shadow-primary/25',
                        'hover:shadow-xl hover:shadow-primary/30',
                        'transition-all duration-300'
                      ],
                      button.variant === 'outline' && [
                        'border-primary/30 hover:border-primary/50',
                        'hover:bg-primary/5'
                      ]
                    )}
                  >
                    <Link
                      href={button.url || ''}
                      target={button.target || '_self'}
                      className="flex items-center gap-2"
                    >
                      {button.icon && (
                        <SmartIcon
                          name={button.icon as string}
                          className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                      <span>{button.title}</span>

                      {/* Arrow icon */}
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>

                      {/* Shimmer effect */}
                      {button.variant !== 'outline' && (
                        <div className="absolute inset-0 -z-10">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </div>
                      )}
                    </Link>
                  </Button>
                ))}
              </div>
            </ScrollAnimation>

            {/* Trust indicators */}
            <ScrollAnimation delay={0.45}>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>5 free images/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </section>
  );
}
