'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

// Showcase preview data (hardcoded for homepage)
const showcaseItems = [
  {
    title: { en: 'Neon Metropolis', zh: '霓虹都市' },
    description: {
      en: 'A stunning cyberpunk cityscape at night with neon lights and flying vehicles.',
      zh: '令人惊艳的赛博朋克夜景城市，霓虹闪烁，飞行器穿梭。',
    },
    image: {
      src: '/imgs/showcases/cyberpunk-city.png',
      alt: 'Cyberpunk cityscape',
    },
  },
  {
    title: { en: 'Cool Cat Vibes', zh: '酷猫范儿' },
    description: {
      en: 'An adorable orange cat wearing stylish sunglasses in warm sunlight.',
      zh: '戴着时尚太阳镜的可爱橘猫，沐浴在温暖阳光中。',
    },
    image: {
      src: '/imgs/showcases/cute-cat.png',
      alt: 'Cute orange cat with sunglasses',
    },
  },
  {
    title: { en: 'Color Flow', zh: '色彩流动' },
    description: {
      en: 'A vibrant abstract art piece with flowing colors and geometric shapes.',
      zh: '流动色彩与几何形状交织的抽象艺术作品。',
    },
    image: {
      src: '/imgs/showcases/abstract-art.png',
      alt: 'Abstract art with flowing colors',
    },
  },
  {
    title: { en: 'Floating Islands', zh: '浮空之岛' },
    description: {
      en: 'A breathtaking fantasy landscape with majestic floating islands.',
      zh: '令人叹为观止的奇幻风景，壮丽的浮空岛屿漂浮于天际。',
    },
    image: {
      src: '/imgs/showcases/fantasy-landscape.png',
      alt: 'Fantasy landscape with floating islands',
    },
  },
];

export function ShowcasesPreview({
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
      <motion.div
        className="container mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1] as const,
        }}
      >
        <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-muted-foreground text-md mx-auto mb-4 max-w-full md:max-w-5xl">
          {section.description}
        </p>
      </motion.div>

      <div className="container grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {showcaseItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <Card className="dark:hover:shadow-primary/10 overflow-hidden p-0 transition-all hover:shadow-lg">
              <CardContent className="p-0">
                <motion.div
                  className="relative aspect-square w-full overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    fill
                    className="rounded-t-lg object-cover transition-transform duration-300"
                  />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {section.buttons && section.buttons.length > 0 && (
        <motion.div
          className="container mt-12 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          {section.buttons.map((button, index) => (
            <Button
              key={index}
              asChild
              variant={(button.variant as any) || 'default'}
              size="lg"
            >
              <Link href={button.url || ''} target={button.target}>
                {button.icon && (
                  <SmartIcon name={button.icon as string} className="mr-2" />
                )}
                {button.title}
              </Link>
            </Button>
          ))}
        </motion.div>
      )}
    </section>
  );
}
