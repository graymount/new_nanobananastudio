'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

// Prompt inspiration data
const promptInspirations = [
  {
    id: 'cyberpunk-city',
    prompt: 'A futuristic cyberpunk city at night with neon lights, flying cars, and towering skyscrapers',
    image: '/imgs/inspirations/cyberpunk-city.png',
    category: 'Sci-Fi',
  },
  {
    id: 'cute-cat',
    prompt: 'A cute orange cat wearing sunglasses relaxing on a tropical beach at sunset',
    image: '/imgs/inspirations/cute-cat.png',
    category: 'Animals',
  },
  {
    id: 'fantasy-landscape',
    prompt: 'A magical fantasy landscape with floating islands, waterfalls, and ancient temples in the clouds',
    image: '/imgs/inspirations/fantasy-landscape.png',
    category: 'Fantasy',
  },
  {
    id: 'abstract-art',
    prompt: 'Abstract fluid art with vibrant colors flowing and mixing like liquid marble',
    image: '/imgs/inspirations/abstract-art.png',
    category: 'Abstract',
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
      className={cn('py-24 md:py-36', section.className, className)}
    >
      {/* Header */}
      <motion.div
        className="container mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          {section.label || 'Inspiration'}
        </div>
        <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-muted-foreground text-md mx-auto max-w-2xl">
          {section.description}
        </p>
      </motion.div>

      {/* Prompt Grid */}
      <div className="container grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {promptInspirations.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Card className="group h-full overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-primary/10">
              <CardContent className="flex h-full flex-col p-0">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.prompt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/app?prompt=${encodeURIComponent(item.prompt)}`}>
                        Try this prompt
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
                {/* Prompt Text */}
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                    "{item.prompt}"
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full justify-center"
                  >
                    <Link href={`/app?prompt=${encodeURIComponent(item.prompt)}`}>
                      <Sparkles className="mr-1 h-4 w-4" />
                      Try this prompt
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View More Button */}
      {section.buttons && section.buttons.length > 0 && (
        <motion.div
          className="container mt-12 flex justify-center"
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
            >
              <Link href={button.url || '/app'}>
                {button.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ))}
        </motion.div>
      )}
    </section>
  );
}
