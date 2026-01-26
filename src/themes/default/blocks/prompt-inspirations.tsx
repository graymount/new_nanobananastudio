'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

// Prompt inspiration data
const promptInspirations = [
  {
    id: 'cyberpunk-city',
    prompt: 'A futuristic cyberpunk city at night with neon lights, flying cars, and towering skyscrapers',
    image: '/imgs/inspirations/cyberpunk-city.png',
    category: 'Sci-Fi',
    gradient: 'from-purple-500/20 to-blue-500/20',
  },
  {
    id: 'cute-cat',
    prompt: 'A cute orange cat wearing sunglasses relaxing on a tropical beach at sunset',
    image: '/imgs/inspirations/cute-cat.png',
    category: 'Animals',
    gradient: 'from-orange-500/20 to-pink-500/20',
  },
  {
    id: 'fantasy-landscape',
    prompt: 'A magical fantasy landscape with floating islands, waterfalls, and ancient temples in the clouds',
    image: '/imgs/inspirations/fantasy-landscape.png',
    category: 'Fantasy',
    gradient: 'from-cyan-500/20 to-emerald-500/20',
  },
  {
    id: 'abstract-art',
    prompt: 'Abstract fluid art with vibrant colors flowing and mixing like liquid marble',
    image: '/imgs/inspirations/abstract-art.png',
    category: 'Abstract',
    gradient: 'from-pink-500/20 to-violet-500/20',
  },
];

export function PromptInspirations({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section
      id={section.id || section.name}
      className={cn('py-24 md:py-36 relative overflow-hidden', section.className, className)}
    >
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-cosmic opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        className="container mb-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
          <Sparkles className="h-4 w-4" />
          {section.label || 'Inspiration'}
        </div>
        <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-balance md:max-w-4xl lg:text-5xl">
          <span className="text-gradient-cosmic-static">{section.title}</span>
        </h2>
        <p className="text-muted-foreground text-lg mx-auto max-w-2xl">
          {section.description}
        </p>
      </motion.div>

      {/* Prompt Grid */}
      <div className="container">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {promptInspirations.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group"
            >
              <div className={cn(
                'relative h-full overflow-hidden rounded-2xl',
                'bg-card/50 dark:bg-card/30',
                'border border-border/50 dark:border-border/30',
                'backdrop-blur-sm',
                'transition-all duration-500',
                'hover:border-primary/40',
                'cosmic-card'
              )}>
                {/* Image container */}
                <div className="relative aspect-square overflow-hidden">
                  {/* Gradient overlay */}
                  <div className={cn(
                    'absolute inset-0 z-10 bg-gradient-to-t',
                    'from-black/80 via-black/20 to-transparent',
                    'opacity-60 group-hover:opacity-40 transition-opacity duration-500'
                  )} />

                  {/* Category badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                      'text-xs font-medium text-white',
                      'bg-white/10 backdrop-blur-md border border-white/20',
                      'shadow-lg'
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {item.category}
                    </span>
                  </div>

                  {/* Image */}
                  <Image
                    src={item.image}
                    alt={item.prompt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />

                  {/* Hover overlay with button */}
                  <div className={cn(
                    'absolute inset-0 z-20',
                    'flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100',
                    'transition-all duration-300'
                  )}>
                    <Button
                      asChild
                      size="default"
                      className={cn(
                        'bg-white/90 text-black hover:bg-white',
                        'shadow-2xl shadow-black/40',
                        'scale-90 group-hover:scale-100',
                        'transition-transform duration-300'
                      )}
                    >
                      <Link href={`/app?prompt=${encodeURIComponent(item.prompt)}`}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Try this prompt
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Prompt text */}
                <div className="p-5">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground transition-colors duration-300">
                    &ldquo;{item.prompt}&rdquo;
                  </p>

                  <div className="mt-4">
                    <Link
                      href={`/app?prompt=${encodeURIComponent(item.prompt)}`}
                      className={cn(
                        'inline-flex items-center gap-2 text-sm font-medium',
                        'text-primary hover:text-primary/80',
                        'transition-colors duration-200'
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>

                {/* Bottom gradient accent */}
                <div className={cn(
                  'absolute bottom-0 left-0 right-0 h-1',
                  'bg-gradient-to-r from-transparent via-primary/50 to-transparent',
                  'opacity-0 group-hover:opacity-100',
                  'transition-opacity duration-300'
                )} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* View More Button */}
      {section.buttons && section.buttons.length > 0 && (
        <motion.div
          className="container mt-16 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {section.buttons.map((button, index) => (
            <Button
              key={index}
              asChild
              variant={(button.variant as any) || 'outline'}
              size="lg"
              className={cn(
                'group px-8 py-6 text-base',
                'border-primary/30 hover:border-primary/50',
                'hover:bg-primary/5'
              )}
            >
              <Link href={button.url || '/app'}>
                {button.title}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </Button>
          ))}
        </motion.div>
      )}
    </section>
  );
}
