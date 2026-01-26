'use client';

import { useState } from 'react';
import { ChevronDown, Lightbulb, Sparkles, Images, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { LazyImage } from '@/shared/blocks/common';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

interface TutorialProps {
  className?: string;
}

export function Tutorial({ className }: TutorialProps) {
  const t = useTranslations('app.tutorial');

  const steps = [
    {
      number: '1',
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
    },
    {
      number: '2',
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
    },
    {
      number: '3',
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: t('features.text_to_image.title'),
      description: t('features.text_to_image.description'),
      image: '/imgs/tutorial/text-to-image.jpg',
    },
    {
      icon: Images,
      title: t('features.edit_merge.title'),
      description: t('features.edit_merge.description'),
      image: '/imgs/tutorial/edit-merge.jpg',
    },
  ];

  const promptTips = [
    {
      title: t('prompt_tips.tip1.title'),
      description: t('prompt_tips.tip1.description'),
      example: t('prompt_tips.tip1.example'),
    },
    {
      title: t('prompt_tips.tip2.title'),
      description: t('prompt_tips.tip2.description'),
      example: t('prompt_tips.tip2.example'),
    },
    {
      title: t('prompt_tips.tip3.title'),
      description: t('prompt_tips.tip3.description'),
      example: t('prompt_tips.tip3.example'),
    },
  ];

  const faqs = [
    {
      question: t('faq.q1.question'),
      answer: t('faq.q1.answer'),
    },
    {
      question: t('faq.q2.question'),
      answer: t('faq.q2.answer'),
    },
    {
      question: t('faq.q3.question'),
      answer: t('faq.q3.answer'),
    },
    {
      question: t('faq.q4.question'),
      answer: t('faq.q4.answer'),
    },
  ];

  return (
    <section className={cn('py-12 md:py-16', className)}>
      <div className="container max-w-5xl">
        {/* Section Title */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gradient-cosmic-static">{t('title')}</h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">{t('subtitle')}</p>
        </div>

        {/* Quick Start Steps */}
        <div className="mb-12 md:mb-16">
          <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            {t('quick_start')}
          </h3>

          {/* Flow Diagram */}
          <div className="mb-8 rounded-xl overflow-hidden border border-border/50 bg-muted/20 shadow-lg shadow-primary/5">
            <LazyImage
              src="/imgs/tutorial/workflow.jpg"
              alt={t('workflow_alt')}
              className="w-full h-auto diagram-image-blend"
            />
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {steps.map((step, index) => (
              <Card key={step.number} className="relative overflow-hidden glass-cosmic border-border/50 cosmic-card group">
                <div className="absolute top-0 left-0 w-14 h-14 bg-gradient-to-br from-primary/20 to-cyan-500/10 flex items-center justify-center rounded-br-2xl">
                  <span className="text-2xl font-bold text-gradient-cosmic-static">{step.number}</span>
                </div>
                <CardContent className="pt-16 pb-5 px-5">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">{step.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-12 md:mb-16">
          <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            {t('features_title')}
          </h3>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="overflow-hidden glass-cosmic border-border/50 cosmic-card group">
                <div className="aspect-video bg-muted/20 overflow-hidden relative">
                  <LazyImage
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 diagram-image-blend"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      index === 0 ? "bg-primary/10" : "bg-cyan-500/10"
                    )}>
                      <feature.icon className={cn(
                        "h-4 w-4",
                        index === 0 ? "text-primary" : "text-cyan-500"
                      )} />
                    </div>
                    <h4 className="font-semibold text-sm md:text-base">{feature.title}</h4>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Prompt Tips */}
        <div className="mb-12 md:mb-16">
          <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-yellow-500/10">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            </div>
            {t('prompt_tips_title')}
          </h3>

          {/* Tips Image */}
          <div className="mb-8 rounded-xl overflow-hidden border border-border/50 bg-muted/20 shadow-lg shadow-primary/5">
            <LazyImage
              src="/imgs/tutorial/prompt-tips.jpg"
              alt={t('prompt_tips_alt')}
              className="w-full h-auto diagram-image-blend"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {promptTips.map((tip, index) => (
              <Card key={index} className="glass-cosmic border-border/50 cosmic-card">
                <CardContent className="p-5">
                  <h4 className="font-semibold mb-2 text-sm md:text-base">{tip.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 leading-relaxed">{tip.description}</p>
                  <div className="bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-primary/10 rounded-lg p-3">
                    <p className="text-xs font-mono text-primary/90 leading-relaxed">{tip.example}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10">
              <HelpCircle className="h-4 w-4 text-cyan-500" />
            </div>
            {t('faq_title')}
          </h3>

          <div className="glass-cosmic border-border/50 rounded-xl overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-border/50 px-1">
                  <AccordionTrigger className="text-left text-sm md:text-base hover:text-primary transition-colors py-4 px-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs md:text-sm leading-relaxed px-4 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
