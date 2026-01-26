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
      image: '/imgs/tutorial/text-to-image.png',
    },
    {
      icon: Images,
      title: t('features.edit_merge.title'),
      description: t('features.edit_merge.description'),
      image: '/imgs/tutorial/edit-merge.png',
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
    <section className={cn('py-16', className)}>
      <div className="container max-w-5xl">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Quick Start Steps */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {t('quick_start')}
          </h3>

          {/* Flow Diagram */}
          <div className="mb-8 rounded-xl overflow-hidden border bg-muted/30">
            <LazyImage
              src="/imgs/tutorial/workflow.png"
              alt={t('workflow_alt')}
              className="w-full h-auto"
            />
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <Card key={step.number} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-12 h-12 bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{step.number}</span>
                </div>
                <CardContent className="pt-16 pb-6 px-6">
                  <h4 className="font-semibold mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('features_title')}
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video bg-muted/30 overflow-hidden">
                  <LazyImage
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">{feature.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Prompt Tips */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {t('prompt_tips_title')}
          </h3>

          {/* Tips Image */}
          <div className="mb-8 rounded-xl overflow-hidden border bg-muted/30">
            <LazyImage
              src="/imgs/tutorial/prompt-tips.png"
              alt={t('prompt_tips_alt')}
              className="w-full h-auto"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {promptTips.map((tip, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{tip.description}</p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-mono text-primary">{tip.example}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {t('faq_title')}
          </h3>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
