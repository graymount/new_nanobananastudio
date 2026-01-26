'use client';

import { Lightbulb, Sparkles, Images, HelpCircle, Wand2, Type, Sun, ArrowRight, Layers, MousePointerClick } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { cn } from '@/shared/lib/utils';

interface TutorialProps {
  className?: string;
}

export function Tutorial({ className }: TutorialProps) {
  const t = useTranslations('app.tutorial');

  const steps = [
    {
      number: '1',
      icon: MousePointerClick,
      title: t('steps.step1.title'),
      description: t('steps.step1.description'),
      color: 'from-violet-500 to-purple-600',
    },
    {
      number: '2',
      icon: Type,
      title: t('steps.step2.title'),
      description: t('steps.step2.description'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      number: '3',
      icon: Wand2,
      title: t('steps.step3.title'),
      description: t('steps.step3.description'),
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: t('features.text_to_image.title'),
      description: t('features.text_to_image.description'),
      gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
    },
    {
      icon: Images,
      title: t('features.edit_merge.title'),
      description: t('features.edit_merge.description'),
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      iconColor: 'text-cyan-500',
      iconBg: 'bg-cyan-500/10',
    },
  ];

  const promptTips = [
    {
      icon: Layers,
      title: t('prompt_tips.tip1.title'),
      description: t('prompt_tips.tip1.description'),
      example: t('prompt_tips.tip1.example'),
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Sun,
      title: t('prompt_tips.tip2.title'),
      description: t('prompt_tips.tip2.description'),
      example: t('prompt_tips.tip2.example'),
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Type,
      title: t('prompt_tips.tip3.title'),
      description: t('prompt_tips.tip3.description'),
      example: t('prompt_tips.tip3.example'),
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
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
    <section className={cn('py-12 md:py-16', className)} aria-labelledby="tutorial-title">
      <div className="container max-w-5xl">
        {/* Section Title */}
        <header className="text-center mb-10 md:mb-14">
          <h2 id="tutorial-title" className="text-2xl md:text-3xl font-bold mb-3 text-gradient-cosmic-static">
            {t('title')}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
            {t('subtitle')}
          </p>
        </header>

        {/* Quick Start Steps - CSS-only flow diagram */}
        <article className="mb-12 md:mb-16" aria-labelledby="quick-start-title">
          <h3 id="quick-start-title" className="text-lg md:text-xl font-semibold mb-8 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10" aria-hidden="true">
              <Lightbulb className="h-4 w-4 text-primary" />
            </span>
            {t('quick_start')}
          </h3>

          {/* CSS-only Steps with connecting lines */}
          <ol className="grid md:grid-cols-3 gap-4 md:gap-0 relative" role="list">
            {steps.map((step, index) => (
              <li key={step.number} className="relative">
                {/* Connecting line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-border via-primary/30 to-border z-0" aria-hidden="true">
                    <ArrowRight className="absolute -right-1 -top-2 h-4 w-4 text-primary/50" />
                  </div>
                )}

                <div className="relative z-10 flex flex-col items-center text-center p-4 md:p-6 rounded-2xl bg-card/50 border border-border/50 md:bg-transparent md:border-0 transition-all hover:bg-card/80 md:hover:bg-card/30 group">
                  {/* Icon with gradient background */}
                  <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-105",
                    step.color
                  )}>
                    <step.icon className="h-8 w-8 md:h-10 md:w-10 text-white" aria-hidden="true" />
                  </div>

                  {/* Step number badge */}
                  <span className="absolute top-2 right-2 md:top-4 md:right-auto md:left-1/2 md:-translate-x-1/2 md:-top-2 w-6 h-6 rounded-full bg-background border-2 border-primary text-xs font-bold flex items-center justify-center text-primary">
                    {step.number}
                  </span>

                  <h4 className="font-semibold text-sm md:text-base mb-2">{step.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </article>

        {/* Features - Card design without images */}
        <article className="mb-12 md:mb-16" aria-labelledby="features-title">
          <h3 id="features-title" className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10" aria-hidden="true">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            {t('features_title')}
          </h3>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Gradient background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  feature.gradient
                )} aria-hidden="true" />

                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl shrink-0", feature.iconBg)}>
                      <feature.icon className={cn("h-6 w-6", feature.iconColor)} aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base md:text-lg mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Prompt Tips - Clean card design */}
        <article className="mb-12 md:mb-16" aria-labelledby="tips-title">
          <h3 id="tips-title" className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-yellow-500/10" aria-hidden="true">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            </span>
            {t('prompt_tips_title')}
          </h3>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {promptTips.map((tip, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-border/50 bg-card/50 p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn("p-2 rounded-lg", tip.bg)} aria-hidden="true">
                    <tip.icon className={cn("h-4 w-4", tip.color)} />
                  </span>
                  <h4 className="font-semibold text-sm md:text-base">{tip.title}</h4>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed">
                  {tip.description}
                </p>

                {/* Example code block */}
                <div className="relative rounded-lg bg-muted/50 border border-border/50 p-3 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-cyan-500 to-primary/50" aria-hidden="true" />
                  <code className="text-xs text-foreground/80 leading-relaxed block pl-2">
                    {tip.example}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* FAQ */}
        <article aria-labelledby="faq-title">
          <h3 id="faq-title" className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10" aria-hidden="true">
              <HelpCircle className="h-4 w-4 text-cyan-500" />
            </span>
            {t('faq_title')}
          </h3>

          <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border-border/50"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <AccordionTrigger className="text-left text-sm md:text-base hover:text-primary transition-colors py-4 px-5 hover:no-underline">
                    <span itemProp="name">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="text-muted-foreground text-sm leading-relaxed px-5 pb-4"
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <span itemProp="text">{faq.answer}</span>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </article>
      </div>
    </section>
  );
}
