'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

interface UseCase {
  id: string;
  title: { en: string; zh: string };
  description: { en: string; zh: string };
  features: { en: string[]; zh: string[] };
  image: string;
  prompt: string;
  icon: string;
}

// Use cases data
const useCases: UseCase[] = [
  {
    id: 'ecommerce',
    title: {
      en: 'E-commerce Product Images',
      zh: '电商产品图',
    },
    description: {
      en: 'Transform ordinary product photos into stunning marketing visuals. Create professional product shots with dynamic lighting, clean backgrounds, and eye-catching compositions.',
      zh: '将普通产品照片转化为令人惊艳的营销视觉。创建具有动态光效、干净背景和吸引眼球构图的专业产品图。',
    },
    features: {
      en: ['Professional lighting', 'Clean backgrounds', 'Dynamic angles'],
      zh: ['专业光效', '干净背景', '动态角度'],
    },
    image: '/imgs/use-cases/ecommerce.png',
    prompt: 'A sleek product photo with professional studio lighting and clean white background',
    icon: 'ShoppingBag',
  },
  {
    id: 'social-media',
    title: {
      en: 'Social Media Content',
      zh: '社交媒体内容',
    },
    description: {
      en: 'Create scroll-stopping content for Instagram, Twitter, and more. Generate unique visuals that capture attention and boost engagement with your audience.',
      zh: '为 Instagram、Twitter 等平台创建引人注目的内容。生成独特的视觉效果，吸引注意力并提升与受众的互动。',
    },
    features: {
      en: ['Eye-catching designs', 'Platform optimized', 'Trending styles'],
      zh: ['吸睛设计', '平台优化', '流行风格'],
    },
    image: '/imgs/use-cases/social-media.png',
    prompt: 'A vibrant social media post design with bold colors and modern typography',
    icon: 'Share2',
  },
  {
    id: 'art-illustration',
    title: {
      en: 'Art & Illustration',
      zh: '艺术与插画',
    },
    description: {
      en: 'Generate unique artwork in any style - from oil paintings to digital art, anime to photorealistic renders. Bring your creative visions to life effortlessly.',
      zh: '生成任何风格的独特艺术作品 - 从油画到数字艺术，从动漫到写实渲染。轻松将你的创意愿景变为现实。',
    },
    features: {
      en: ['Multiple art styles', 'High resolution', 'Unique creations'],
      zh: ['多种艺术风格', '高分辨率', '独特创作'],
    },
    image: '/imgs/use-cases/art-illustration.png',
    prompt: 'A beautiful digital artwork in fantasy style with vibrant colors and intricate details',
    icon: 'Palette',
  },
  {
    id: 'photo-editing',
    title: {
      en: 'Photo Enhancement',
      zh: '照片增强',
    },
    description: {
      en: 'Transform and enhance your photos with AI. Change backgrounds, apply artistic styles, fix imperfections, or completely reimagine your images.',
      zh: '用 AI 转换和增强你的照片。更换背景、应用艺术风格、修复瑕疵，或完全重新构想你的图像。',
    },
    features: {
      en: ['Background removal', 'Style transfer', 'Smart editing'],
      zh: ['背景移除', '风格迁移', '智能编辑'],
    },
    image: '/imgs/use-cases/photo-editing.png',
    prompt: 'Enhance this photo with better lighting and a beautiful sunset background',
    icon: 'ImagePlus',
  },
];

export function UseCases({
  section,
  className,
  locale = 'en',
}: {
  section: Section;
  className?: string;
  locale?: string;
}) {
  const lang = locale === 'zh' ? 'zh' : 'en';

  return (
    <section
      id={section.id || section.name}
      className={cn('py-24 md:py-36', section.className, className)}
    >
      {/* Header */}
      <motion.div
        className="container mb-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
          {section.title}
        </h2>
        <p className="text-muted-foreground text-md mx-auto max-w-2xl">
          {section.description}
        </p>
      </motion.div>

      {/* Use Cases List */}
      <div className="container space-y-24">
        {useCases.map((useCase, index) => {
          const isReversed = index % 2 === 1;

          return (
            <motion.div
              key={useCase.id}
              className={cn(
                'grid items-center gap-12 lg:grid-cols-2',
                isReversed && 'lg:flex-row-reverse'
              )}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Image */}
              <div className={cn('relative', isReversed && 'lg:order-2')}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                  <Image
                    src={useCase.image}
                    alt={useCase.title[lang]}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-2xl bg-primary/10" />
              </div>

              {/* Content */}
              <div className={cn('space-y-6', isReversed && 'lg:order-1')}>
                {/* Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <SmartIcon name={useCase.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold lg:text-3xl">
                    {useCase.title[lang]}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {useCase.description[lang]}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {useCase.features[lang].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button asChild size="lg" className="mt-4">
                  <Link href={`/app?prompt=${encodeURIComponent(useCase.prompt)}`}>
                    {lang === 'zh' ? '立即试试' : 'Try it now'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
