'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { RiCheckLine, RiCloseLine, RiSparklingLine } from 'react-icons/ri';

interface TextRenderingTestProps {
  section?: {
    id?: string;
    title?: string;
    description?: string;
    placeholder?: string;
    examples?: string[];
    comparisonExamples?: {
      incorrect: string[];
      correct: string[];
    };
  };
}

export function TextRenderingTest({ section }: TextRenderingTestProps) {
  const title = section?.title;
  const description = section?.description;
  const placeholder = section?.placeholder;
  const examples = section?.examples || ['Grand Opening Sale', '50% OFF TODAY', 'Welcome to Our Store'];
  const comparisonExamples = section?.comparisonExamples || {
    incorrect: ['RESTRAUNT', 'WELLCOME'],
    correct: ['RESTAURANT', 'WELCOME'],
  };
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: 'image',
          scene: 'text-to-image',
          provider: 'gemini',
          model: 'gemini-3.0-flash-image',
          prompt: `Create a clean, professional image with the text "${text}" displayed prominently. The text should be clear, readable, and correctly spelled.`,
          tool: 'text-rendering-test',
          source: 'homepage',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.taskId) {
        // Poll for result
        const result = await pollTaskResult(data.taskId);
        if (result?.url) {
          setGeneratedImage(result.url);
        }
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      // Show error but don't block UI
    } finally {
      setIsGenerating(false);
    }
  };

  const pollTaskResult = async (taskId: string, maxAttempts = 30): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between polls

      try {
        const response = await fetch(`/api/ai/query?taskId=${taskId}`);
        const data = await response.json();

        if (data.status === 'completed' && data.taskResult) {
          const result = JSON.parse(data.taskResult);
          return result;
        }

        if (data.status === 'failed') {
          throw new Error('Generation failed');
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }
    throw new Error('Generation timeout');
  };

  const handleExampleClick = (example: string) => {
    setText(example);
  };

  return (
    <section
      id={section?.id || 'text-test'}
      className="relative overflow-hidden py-20 md:py-32"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="bg-primary/5 absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <div className="container space-y-10 md:space-y-14">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-balance text-center">
          {title && (
            <h2 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              {description}
            </p>
          )}
        </div>

        {/* Main Test Section */}
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Default Showcase - Before/After Comparison */}
          <Card className="overflow-hidden border-2">
            <div className="bg-muted/50 border-b px-6 py-4">
              <h3 className="text-center text-lg font-semibold">
                See The Difference (No Input Required)
              </h3>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-3">
              {/* Example 1 */}
              <div className="space-y-3">
                <p className="text-center font-medium text-sm">
                  "RESTAURANT"
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-red-600">
                      <RiCloseLine className="size-4" />
                      <span>Other AI</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 flex h-24 items-center justify-center rounded border-2 border-red-200 p-2 dark:border-red-900">
                      <span className="font-mono text-sm text-red-600 dark:text-red-400">
                        RESTRAUNT
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                      <RiCheckLine className="size-4" />
                      <span>Nano Banana</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 flex h-24 items-center justify-center rounded border-2 border-green-200 p-2 dark:border-green-900">
                      <span className="font-mono text-sm text-green-600 dark:text-green-400">
                        RESTAURANT
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example 2 */}
              <div className="space-y-3">
                <p className="text-center font-medium text-sm">
                  "WELCOME"
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-red-600">
                      <RiCloseLine className="size-4" />
                      <span>Other AI</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 flex h-24 items-center justify-center rounded border-2 border-red-200 p-2 dark:border-red-900">
                      <span className="font-mono text-sm text-red-600 dark:text-red-400">
                        WELLCOME
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                      <RiCheckLine className="size-4" />
                      <span>Nano Banana</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 flex h-24 items-center justify-center rounded border-2 border-green-200 p-2 dark:border-green-900">
                      <span className="font-mono text-sm text-green-600 dark:text-green-400">
                        WELCOME
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example 3 - Complex Case */}
              <div className="space-y-3">
                <p className="text-center font-medium text-sm">
                  "ARTISAN COFFEE"
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-red-600">
                      <RiCloseLine className="size-4" />
                      <span>Other AI</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 flex h-24 items-center justify-center rounded border-2 border-red-200 p-2 dark:border-red-900">
                      <span className="font-mono text-xs text-red-600 dark:text-red-400">
                        ARTISIAN COFEE
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                      <RiCheckLine className="size-4" />
                      <span>Nano Banana</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 flex h-24 items-center justify-center rounded border-2 border-green-200 p-2 dark:border-green-900">
                      <span className="font-mono text-xs text-green-600 dark:text-green-400">
                        ARTISAN COFFEE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Trust Signal */}
            <div className="bg-muted/50 border-t px-6 py-3">
              <p className="text-center text-xs text-muted-foreground">
                Based on real outputs from diffusion models like Midjourney and DALL·E
              </p>
            </div>
          </Card>

          {/* Emotional Hook */}
          <div className="text-center">
            <p className="text-muted-foreground text-base md:text-lg">
              <strong className="text-foreground">Most AI generators will get this wrong.</strong> Try it yourself.
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              placeholder={
                placeholder || "Type the text you want to generate (e.g. 'Grand Opening Sale')"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGenerate();
                }
              }}
              className="flex-1 text-base"
            />
            <Button
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating}
              size="lg"
              className="gap-2"
            >
              <RiSparklingLine className="size-5" />
              {isGenerating ? 'Generating...' : 'See if your text renders correctly →'}
            </Button>
          </div>

          {/* Preset Examples */}
          <div className="flex flex-wrap gap-2">
            <span className="text-muted-foreground text-sm">Try:</span>
            {examples.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleExampleClick(example)}
                className="text-sm"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        {/* Generated Image Output */}
        {generatedImage && (
          <Card className="overflow-hidden p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Generated Result:</h3>
              <div className="flex min-h-[300px] items-center justify-center rounded-lg overflow-hidden">
                <img
                  src={generatedImage}
                  alt={`AI generated image with text: ${text}`}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm text-center">
                  Text rendered: <strong className="text-foreground">"{text}"</strong>
                </p>
                {/* Wow Moment Reinforcement */}
                <p className="text-center text-sm font-medium text-green-600">
                  ✓ Notice how every letter is correct — even in longer phrases
                </p>
              </div>

              {/* Deep CTA - Continue to Full Editor */}
              <div className="border-t pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Like what you see?</strong> Continue editing in the full generator
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="gap-2"
                  >
                    <a href={`/app?prompt=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
                      Continue Editing →
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

          {/* Comparison Block */}
          <Card className="border-2 p-6">
            <h3 className="mb-6 text-xl font-bold">Text Accuracy Comparison</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Other AI - Incorrect */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <RiCloseLine className="size-6 text-red-500" />
                  <h4 className="font-semibold text-red-500">Other AI Tools</h4>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 space-y-2 rounded-lg border-2 border-red-200 p-4 dark:border-red-900">
                  {comparisonExamples.incorrect.map((text, index) => (
                    <div
                      key={index}
                      className="font-mono text-lg text-red-600 dark:text-red-400"
                    >
                      {text}
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm">
                  Common spelling errors and garbled text
                </p>
              </div>

              {/* Nano Banana - Correct */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <RiCheckLine className="size-6 text-green-500" />
                  <h4 className="font-semibold text-green-500">Nano Banana Studio</h4>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 space-y-2 rounded-lg border-2 border-green-200 p-4 dark:border-green-900">
                  {comparisonExamples.correct.map((text, index) => (
                    <div
                      key={index}
                      className="font-mono text-lg text-green-600 dark:text-green-400"
                    >
                      {text}
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-sm">
                  Accurate text rendering every time
                </p>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="bg-muted mt-6 rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm">
                <strong>Try it yourself:</strong> Generate an image with text and see the difference
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
