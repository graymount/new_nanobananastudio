'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { AIMediaType, AITaskStatus } from '@/extensions/ai/types';
import { LazyImage } from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';

interface HomeGeneratorProps {
  className?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
}

const GUEST_LIMIT = 8;
const GUEST_STORAGE_KEY = 'nano_banana_guest_generations';
const MAX_PROMPT_LENGTH = 1000;

// Example prompts for quick start
const EXAMPLE_PROMPTS = [
  { label: '🌃 Cyberpunk City', prompt: 'A futuristic cyberpunk city at night with neon lights and flying cars' },
  { label: '🐱 Cute Cat', prompt: 'A cute orange cat wearing sunglasses relaxing on a beach' },
  { label: '🎨 Abstract Art', prompt: 'Abstract colorful fluid art with vibrant gradients and flowing shapes' },
  { label: '🏔️ Fantasy Landscape', prompt: 'A magical fantasy landscape with floating islands and waterfalls' },
];

function getGuestGenerations(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function incrementGuestGenerations(): void {
  if (typeof window === 'undefined') return;
  const current = getGuestGenerations();
  localStorage.setItem(GUEST_STORAGE_KEY, String(current + 1));
}

export function HomeGenerator({ className }: HomeGeneratorProps) {
  const t = useTranslations('home.generator');

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [guestGenerations, setGuestGenerations] = useState(0);

  const { user, isCheckSign, setIsShowSignModal, setIsShowCreditsExhaustedModal, fetchUserCredits } = useAppContext();

  useEffect(() => {
    setIsMounted(true);
    setGuestGenerations(getGuestGenerations());
  }, []);

  const canGuestGenerate = !user && guestGenerations < GUEST_LIMIT;
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const promptLength = prompt.trim().length;
  const isPromptTooLong = promptLength > MAX_PROMPT_LENGTH;

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  const handleGenerate = async () => {
    // Check if user can generate
    if (!user && !canGuestGenerate) {
      setIsShowSignModal(true);
      return;
    }

    if (user && remainingCredits < 1) {
      setIsShowCreditsExhaustedModal(true);
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error(t('empty_prompt'));
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: AIMediaType.IMAGE,
          scene: 'text-to-image',
          provider: 'gemini',
          model: 'gemini-2.5-flash-image',
          prompt: trimmedPrompt,
          options: {},
        }),
      });

      if (!resp.ok) {
        throw new Error(`Request failed with status: ${resp.status}`);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message || 'Failed to generate image');
      }

      // Gemini returns synchronously
      if (data.status === AITaskStatus.SUCCESS && data.taskInfo) {
        const taskInfo = typeof data.taskInfo === 'string'
          ? JSON.parse(data.taskInfo)
          : data.taskInfo;

        const images = taskInfo.images || [];
        if (images.length > 0) {
          setGeneratedImage({
            id: data.id,
            url: images[0].imageUrl || images[0].url,
          });
          toast.success(t('success'));

          // Track guest generation
          if (!user) {
            incrementGuestGenerations();
            setGuestGenerations(prev => prev + 1);
          }
        } else {
          throw new Error('No image returned');
        }
      } else {
        throw new Error('Generation failed');
      }

      if (user) {
        await fetchUserCredits();
      }
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      toast.error(error.message || t('error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage?.url) return;

    try {
      const resp = await fetch(`/api/proxy/file?url=${encodeURIComponent(generatedImage.url)}`);
      if (!resp.ok) throw new Error('Failed to fetch image');

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `nano-banana-${generatedImage.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      toast.success(t('downloaded'));
    } catch (error) {
      toast.error(t('download_error'));
    }
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto', className)}>
      {/* Generator Card */}
      <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 shadow-lg">
        {/* Prompt Input */}
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('placeholder')}
            className="min-h-[100px] text-base resize-none bg-background/50"
            disabled={isGenerating}
          />

          {/* Character count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{promptLength} / {MAX_PROMPT_LENGTH}</span>
            {isPromptTooLong && (
              <span className="text-destructive">{t('prompt_too_long')}</span>
            )}
          </div>

          {/* Example Prompts */}
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(example.prompt)}
                disabled={isGenerating}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors disabled:opacity-50"
              >
                {example.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isMounted ? (
              <Button className="flex-1" disabled size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('loading')}
              </Button>
            ) : isCheckSign ? (
              <Button className="flex-1" disabled size="lg">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('checking')}
              </Button>
            ) : (
              <Button
                size="lg"
                className="flex-1"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || isPromptTooLong}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('generate')}
                  </>
                )}
              </Button>
            )}

            <Button asChild variant="outline" size="lg" className="sm:w-auto">
              <Link href="/app">
                {t('open_full_app')}
              </Link>
            </Button>
          </div>

          {/* Credits Info */}
          {isMounted && (
            <div className="text-center text-sm text-muted-foreground">
              {user ? (
                <span>{t('credits_remaining', { credits: remainingCredits })}</span>
              ) : (
                <span>
                  {t('guest_remaining', { remaining: Math.max(0, GUEST_LIMIT - guestGenerations), total: GUEST_LIMIT })}
                  {' · '}
                  <button
                    onClick={() => setIsShowSignModal(true)}
                    className="text-primary hover:underline"
                  >
                    {t('sign_in_for_more')}
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generated Image */}
      {generatedImage && (
        <div className="mt-6 bg-card/50 backdrop-blur-sm border rounded-2xl p-4 shadow-lg">
          <div className="relative overflow-hidden rounded-xl">
            <LazyImage
              src={generatedImage.url}
              alt="Generated image"
              className="w-full h-auto"
            />
            <div className="absolute bottom-3 right-3">
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                {t('download')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && !generatedImage && (
        <div className="mt-6 bg-card/50 backdrop-blur-sm border rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-muted-foreground">{t('generating_message')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
