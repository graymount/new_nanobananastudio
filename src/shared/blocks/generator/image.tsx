'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Download,
  ImageIcon,
  Loader2,
  Pencil,
  Sparkles,
  User,
  Palette,
  Wand2,
  FolderOpen,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { AIMediaType, AITaskStatus } from '@/extensions/ai/types';
import {
  ImageUploader,
  ImageUploaderValue,
  LazyImage,
} from '@/shared/blocks/common';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { Progress } from '@/shared/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';

interface ImageGeneratorProps {
  maxSizeMB?: number;
  srOnlyTitle?: string;
  className?: string;
  initialRefImage?: string;
  initialPrompt?: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  provider?: string;
  model?: string;
  prompt?: string;
}

interface BackendTask {
  id: string;
  status: string;
  provider: string;
  model: string;
  prompt: string | null;
  taskInfo: string | null;
  taskResult: string | null;
}

type ImageGeneratorTab = 'text-to-image' | 'image-to-image';

const POLL_INTERVAL = 5000;
const GENERATION_TIMEOUT = 180000;
const MAX_PROMPT_LENGTH = 2000;

const MODEL_OPTIONS = [
  {
    value: 'gemini-2.5-flash-image',
    label: 'Nano Banana',
    provider: 'gemini',
    scenes: ['text-to-image', 'image-to-image'],
    maxImages: 1,
  },
  {
    value: 'gemini-3-pro-image-preview',
    label: 'Nano Banana Pro',
    provider: 'gemini',
    scenes: ['text-to-image', 'image-to-image'],
    maxImages: 14,
  },
];

// Only Gemini provider is supported
const DEFAULT_PROVIDER = 'gemini';

// Style prompt suggestions for the empty preview area
const STYLE_SUGGESTIONS = [
  { emoji: '🌃', labelKey: 'cyberpunk', promptSuffix: 'cyberpunk style, neon lights, futuristic city, high contrast' },
  { emoji: '🎨', labelKey: 'ghibli', promptSuffix: 'Studio Ghibli style, soft watercolors, whimsical, anime' },
  { emoji: '📷', labelKey: 'realistic', promptSuffix: 'photorealistic, high detail, professional photography' },
  { emoji: '🖌️', labelKey: 'watercolor', promptSuffix: 'watercolor painting style, soft edges, fluid colors' },
  { emoji: '🎨', labelKey: 'oil_painting', promptSuffix: 'oil painting style, rich textures, bold brush strokes' },
  { emoji: '💥', labelKey: 'comic', promptSuffix: 'comic book style, bold outlines, vibrant colors, halftone dots' },
  { emoji: '👾', labelKey: 'pixel_art', promptSuffix: '8-bit pixel art style, retro gaming aesthetic' },
  { emoji: '✨', labelKey: 'anime', promptSuffix: 'anime style, Japanese animation, detailed eyes, dynamic pose' },
  { emoji: '🏮', labelKey: 'chinese_ink', promptSuffix: 'Chinese ink wash painting style, minimalist, elegant brushwork' },
  { emoji: '🌸', labelKey: 'pastel', promptSuffix: 'soft pastel colors, dreamy atmosphere, gentle lighting' },
];

function parseTaskResult(taskResult: string | null): any {
  if (!taskResult) {
    return null;
  }

  try {
    return JSON.parse(taskResult);
  } catch (error) {
    console.warn('Failed to parse taskResult:', error);
    return null;
  }
}

function extractImageUrls(result: any): string[] {
  if (!result) {
    return [];
  }

  const output = result.output ?? result.images ?? result.data;

  if (!output) {
    return [];
  }

  if (typeof output === 'string') {
    return [output];
  }

  if (Array.isArray(output)) {
    return output
      .flatMap((item) => {
        if (!item) return [];
        if (typeof item === 'string') return [item];
        if (typeof item === 'object') {
          const candidate =
            item.url ?? item.uri ?? item.image ?? item.src ?? item.imageUrl;
          return typeof candidate === 'string' ? [candidate] : [];
        }
        return [];
      })
      .filter(Boolean);
  }

  if (typeof output === 'object') {
    const candidate =
      output.url ?? output.uri ?? output.image ?? output.src ?? output.imageUrl;
    if (typeof candidate === 'string') {
      return [candidate];
    }
  }

  return [];
}

export function ImageGenerator({
  maxSizeMB = 50,
  srOnlyTitle,
  className,
  initialRefImage,
  initialPrompt,
}: ImageGeneratorProps) {
  const t = useTranslations('ai.image.generator');

  const [activeTab, setActiveTab] = useState<ImageGeneratorTab>(
    initialRefImage ? 'image-to-image' : 'text-to-image'
  );

  const [costCredits, setCostCredits] = useState<number>(
    initialRefImage ? 4 : 2
  );
  const provider = DEFAULT_PROVIDER;
  const [model, setModel] = useState(MODEL_OPTIONS[0]?.value ?? '');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [referenceImageItems, setReferenceImageItems] = useState<
    ImageUploaderValue[]
  >(
    initialRefImage
      ? [{ id: 'initial', preview: initialRefImage, url: initialRefImage, status: 'uploaded' }]
      : []
  );
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>(
    initialRefImage ? [initialRefImage] : []
  );
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );
  const [taskStatus, setTaskStatus] = useState<AITaskStatus | null>(null);
  const [downloadingImageId, setDownloadingImageId] = useState<string | null>(
    null
  );
  const [isMounted, setIsMounted] = useState(false);

  // Original image for comparison (when editing)
  const [originalImageForComparison, setOriginalImageForComparison] = useState<string | null>(null);
  const [comparisonSliderPosition, setComparisonSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Gallery selection states
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<Array<{
    id: string;
    imageUrl: string;
    prompt: string;
  }>>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const { user, isCheckSign, setIsShowSignModal, fetchUserCredits } =
    useAppContext();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const promptLength = prompt.trim().length;
  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const isPromptTooLong = promptLength > MAX_PROMPT_LENGTH;
  const isTextToImageMode = activeTab === 'text-to-image';

  // Get current model's max images limit
  const currentModelConfig = useMemo(
    () => MODEL_OPTIONS.find((opt) => opt.value === model),
    [model]
  );
  const maxImages = currentModelConfig?.maxImages ?? 1;
  const allowMultipleImages = maxImages > 1;

  const handleTabChange = (value: string) => {
    const tab = value as ImageGeneratorTab;
    setActiveTab(tab);

    const availableModels = MODEL_OPTIONS.filter((option) =>
      option.scenes.includes(tab)
    );

    if (availableModels.length > 0) {
      setModel(availableModels[0].value);
    } else {
      setModel('');
    }

    if (tab === 'text-to-image') {
      setCostCredits(2);
    } else {
      setCostCredits(4);
    }
  };

  const handleModelChange = useCallback(
    (newModel: string) => {
      const newModelConfig = MODEL_OPTIONS.find((opt) => opt.value === newModel);
      const newMaxImages = newModelConfig?.maxImages ?? 1;

      // If switching to a model with lower maxImages, clear excess images
      if (referenceImageItems.length > newMaxImages) {
        const trimmedItems = referenceImageItems.slice(0, newMaxImages);
        setReferenceImageItems(trimmedItems);
        const trimmedUrls = trimmedItems
          .filter((item) => item.status === 'uploaded' && item.url)
          .map((item) => item.url as string);
        setReferenceImageUrls(trimmedUrls);
        toast.info(`Switched to ${newModelConfig?.label}. Only ${newMaxImages} image${newMaxImages > 1 ? 's' : ''} allowed.`);
      }

      setModel(newModel);
    },
    [referenceImageItems]
  );

  const taskStatusLabel = useMemo(() => {
    if (!taskStatus) {
      return '';
    }

    switch (taskStatus) {
      case AITaskStatus.PENDING:
        return 'Waiting for the model to start';
      case AITaskStatus.PROCESSING:
        return 'Generating your image...';
      case AITaskStatus.SUCCESS:
        return 'Image generation completed';
      case AITaskStatus.FAILED:
        return 'Generation failed';
      default:
        return '';
    }
  }, [taskStatus]);

  const handleReferenceImagesChange = useCallback(
    (items: ImageUploaderValue[]) => {
      setReferenceImageItems(items);
      const uploadedUrls = items
        .filter((item) => item.status === 'uploaded' && item.url)
        .map((item) => item.url as string);
      setReferenceImageUrls(uploadedUrls);
    },
    []
  );

  const isReferenceUploading = useMemo(
    () => referenceImageItems.some((item) => item.status === 'uploading'),
    [referenceImageItems]
  );

  const hasReferenceUploadError = useMemo(
    () => referenceImageItems.some((item) => item.status === 'error'),
    [referenceImageItems]
  );

  // Fetch user's gallery images
  const fetchGalleryImages = useCallback(async () => {
    if (!user) return;

    setIsLoadingGallery(true);
    try {
      const response = await fetch('/api/user/images?limit=50');
      const data = await response.json();
      if (data.code === 0 && data.data?.images) {
        setGalleryImages(data.data.images);
      }
    } catch (error) {
      console.error('Failed to fetch gallery images:', error);
      toast.error(t('gallery.fetch_error'));
    } finally {
      setIsLoadingGallery(false);
    }
  }, [user, t]);

  // Handle opening gallery dialog
  const handleOpenGallery = useCallback(() => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }
    setIsGalleryOpen(true);
    fetchGalleryImages();
  }, [user, setIsShowSignModal, fetchGalleryImages]);

  // Handle selecting an image from gallery
  const handleSelectFromGallery = useCallback((imageUrl: string) => {
    // Check if we can add more images
    if (referenceImageItems.length >= maxImages) {
      toast.error(t('gallery.max_images_reached', { max: maxImages }));
      return;
    }

    // Check if image is already added
    const isAlreadyAdded = referenceImageItems.some(
      (item) => item.url === imageUrl || item.preview === imageUrl
    );
    if (isAlreadyAdded) {
      toast.info(t('gallery.image_already_added'));
      return;
    }

    // Add the selected image
    const newItem: ImageUploaderValue = {
      id: `gallery-${Date.now()}`,
      preview: imageUrl,
      url: imageUrl,
      status: 'uploaded',
    };

    const newItems = [...referenceImageItems, newItem];
    setReferenceImageItems(newItems);
    setReferenceImageUrls([...referenceImageUrls, imageUrl]);

    setIsGalleryOpen(false);
    toast.success(t('gallery.image_added'));
  }, [referenceImageItems, referenceImageUrls, maxImages, t]);

  const resetTaskState = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setTaskId(null);
    setGenerationStartTime(null);
    setTaskStatus(null);
  }, []);

  const pollTaskStatus = useCallback(
    async (id: string) => {
      try {
        if (
          generationStartTime &&
          Date.now() - generationStartTime > GENERATION_TIMEOUT
        ) {
          resetTaskState();
          toast.error('Image generation timed out. Please try again.');
          return true;
        }

        const resp = await fetch('/api/ai/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId: id }),
        });

        if (!resp.ok) {
          throw new Error(`request failed with status: ${resp.status}`);
        }

        const { code, message, data } = await resp.json();
        if (code !== 0) {
          throw new Error(message || 'Query task failed');
        }

        const task = data as BackendTask;
        const currentStatus = task.status as AITaskStatus;
        setTaskStatus(currentStatus);

        const parsedResult = parseTaskResult(task.taskInfo);
        const imageUrls = extractImageUrls(parsedResult);

        if (currentStatus === AITaskStatus.PENDING) {
          setProgress((prev) => Math.max(prev, 20));
          return false;
        }

        if (currentStatus === AITaskStatus.PROCESSING) {
          if (imageUrls.length > 0) {
            setGeneratedImages(
              imageUrls.map((url, index) => ({
                id: `${task.id}-${index}`,
                url,
                provider: task.provider,
                model: task.model,
                prompt: task.prompt ?? undefined,
              }))
            );
            setProgress((prev) => Math.max(prev, 85));
          } else {
            setProgress((prev) => Math.min(prev + 10, 80));
          }
          return false;
        }

        if (currentStatus === AITaskStatus.SUCCESS) {
          if (imageUrls.length === 0) {
            toast.error('The provider returned no images. Please retry.');
          } else {
            setGeneratedImages(
              imageUrls.map((url, index) => ({
                id: `${task.id}-${index}`,
                url,
                provider: task.provider,
                model: task.model,
                prompt: task.prompt ?? undefined,
              }))
            );
            toast.success('Image generated successfully');
          }

          setProgress(100);
          resetTaskState();
          return true;
        }

        if (currentStatus === AITaskStatus.FAILED) {
          const errorMessage =
            parsedResult?.errorMessage || 'Generate image failed';
          toast.error(errorMessage);
          resetTaskState();

          fetchUserCredits();

          return true;
        }

        setProgress((prev) => Math.min(prev + 5, 95));
        return false;
      } catch (error: any) {
        console.error('Error polling image task:', error);
        toast.error(`Query task failed: ${error.message}`);
        resetTaskState();

        fetchUserCredits();

        return true;
      }
    },
    [generationStartTime, resetTaskState]
  );

  useEffect(() => {
    if (!taskId || !isGenerating) {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (!taskId) {
        return;
      }
      const completed = await pollTaskStatus(taskId);
      if (completed) {
        cancelled = true;
      }
    };

    tick();

    const interval = setInterval(async () => {
      if (cancelled || !taskId) {
        clearInterval(interval);
        return;
      }
      const completed = await pollTaskStatus(taskId);
      if (completed) {
        clearInterval(interval);
      }
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [taskId, isGenerating, pollTaskStatus]);

  const handleGenerate = async () => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    if (remainingCredits < costCredits) {
      toast.error('Insufficient credits. Please top up to keep creating.');
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      toast.error('Please enter a prompt before generating.');
      return;
    }

    if (!provider || !model) {
      toast.error('Provider or model is not configured correctly.');
      return;
    }

    if (!isTextToImageMode && referenceImageUrls.length === 0) {
      toast.error('Please upload reference images before generating.');
      return;
    }

    setIsGenerating(true);
    setProgress(15);
    setTaskStatus(AITaskStatus.PENDING);
    setGeneratedImages([]);
    setGenerationStartTime(Date.now());

    try {
      const options: any = {};

      if (!isTextToImageMode) {
        options.image_input = referenceImageUrls;
      }

      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: AIMediaType.IMAGE,
          scene: isTextToImageMode ? 'text-to-image' : 'image-to-image',
          provider,
          model,
          prompt: trimmedPrompt,
          options,
        }),
      });

      if (!resp.ok) {
        throw new Error(`request failed with status: ${resp.status}`);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message || 'Failed to create an image task');
      }

      const newTaskId = data?.id;
      if (!newTaskId) {
        throw new Error('Task id missing in response');
      }

      if (data.status === AITaskStatus.SUCCESS && data.taskInfo) {
        const parsedResult = parseTaskResult(data.taskInfo);
        const imageUrls = extractImageUrls(parsedResult);

        if (imageUrls.length > 0) {
          setGeneratedImages(
            imageUrls.map((url, index) => ({
              id: `${newTaskId}-${index}`,
              url,
              provider,
              model,
              prompt: trimmedPrompt,
            }))
          );
          toast.success('Image generated successfully');
          setProgress(100);
          resetTaskState();
          await fetchUserCredits();
          return;
        }
      }

      setTaskId(newTaskId);
      setProgress(25);

      await fetchUserCredits();
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      toast.error(`Failed to generate image: ${error.message}`);
      resetTaskState();
    }
  };

  const handleDownloadImage = async (image: GeneratedImage) => {
    if (!image.url) {
      return;
    }

    try {
      setDownloadingImageId(image.id);
      // fetch image via proxy
      const resp = await fetch(
        `/api/proxy/file?url=${encodeURIComponent(image.url)}`
      );
      if (!resp.ok) {
        throw new Error('Failed to fetch image');
      }

      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Failed to download image:', error);
      toast.error('Failed to download image');
    } finally {
      setDownloadingImageId(null);
    }
  };

  // Handle editing a generated image - switch to image-to-image mode with this image
  const handleEditImage = useCallback((image: GeneratedImage) => {
    if (!image.url) {
      return;
    }

    // Store original image for comparison after editing
    setOriginalImageForComparison(image.url);
    setComparisonSliderPosition(50);

    // Switch to image-to-image tab
    setActiveTab('image-to-image');
    setCostCredits(4);

    // Set the generated image as reference image
    const newItem: ImageUploaderValue = {
      id: `edit-${Date.now()}`,
      preview: image.url,
      url: image.url,
      status: 'uploaded',
    };
    setReferenceImageItems([newItem]);
    setReferenceImageUrls([image.url]);

    // Clear the prompt so user can enter new editing instructions
    setPrompt('');

    // Clear previous generated images to make room for comparison
    setGeneratedImages([]);

    // Scroll to top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast.success(t('edit_image_loaded'));
  }, [t]);

  // Clear comparison mode
  const handleClearComparison = useCallback(() => {
    setOriginalImageForComparison(null);
    setComparisonSliderPosition(50);
  }, []);

  // Handle comparison slider drag
  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSlider(true);
  }, []);

  const handleSliderMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparisonSliderPosition(percentage);
  }, [isDraggingSlider]);

  const handleSliderMouseUp = useCallback(() => {
    setIsDraggingSlider(false);
  }, []);

  // Handle touch events for mobile
  const handleSliderTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingSlider) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setComparisonSliderPosition(percentage);
  }, [isDraggingSlider]);

  return (
    <section className={cn('', className)}>
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Input Card */}
            <Card className="glass-cosmic border-border/50 shadow-xl shadow-primary/5 animate-in-2">
              <CardHeader className="pb-4">
                {srOnlyTitle && <h2 className="sr-only">{srOnlyTitle}</h2>}
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  {t('title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pb-6">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="bg-muted/50 border border-border/50 grid w-full grid-cols-2 p-1 h-11">
                    <TabsTrigger
                      value="text-to-image"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                    >
                      {t('tabs.text-to-image')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="image-to-image"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
                    >
                      {t('tabs.image-to-image')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('form.model')}</Label>
                  <Select value={model} onValueChange={handleModelChange}>
                    <SelectTrigger className="w-full h-11 bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                      <SelectValue placeholder={t('form.select_model')} />
                    </SelectTrigger>
                    <SelectContent className="glass-cosmic">
                      {MODEL_OPTIONS.filter((option) =>
                        option.scenes.includes(activeTab)
                      ).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            {option.label}
                            {option.value.includes('pro') && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gradient-to-r from-primary/20 to-cyan-500/20 text-primary">
                                PRO
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!isTextToImageMode && (
                  <div className="space-y-4">
                    <ImageUploader
                      title={t('form.reference_image')}
                      allowMultiple={allowMultipleImages}
                      maxImages={maxImages}
                      maxSizeMB={maxSizeMB}
                      onChange={handleReferenceImagesChange}
                      emptyHint={t('form.reference_image_placeholder')}
                      defaultPreviews={referenceImageUrls.length > 0 ? referenceImageUrls : undefined}
                    />

                    {/* Select from Gallery Button */}
                    {referenceImageItems.length < maxImages && (
                      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5"
                            onClick={handleOpenGallery}
                          >
                            <FolderOpen className="mr-2 h-4 w-4" />
                            {t('gallery.select_from_gallery')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle>{t('gallery.title')}</DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto py-4">
                            {isLoadingGallery ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              </div>
                            ) : galleryImages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                                <p>{t('gallery.no_images')}</p>
                                <p className="text-sm mt-1">{t('gallery.create_first')}</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-3">
                                {galleryImages.map((image) => (
                                  <button
                                    key={image.id}
                                    className="group relative aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-all hover:ring-2 hover:ring-primary/50"
                                    onClick={() => handleSelectFromGallery(image.imageUrl)}
                                  >
                                    <img
                                      src={image.imageUrl}
                                      alt={image.prompt || 'AI generated image'}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <span className="text-white text-sm font-medium">
                                        {t('gallery.select')}
                                      </span>
                                    </div>
                                    {image.prompt && (
                                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs line-clamp-2">
                                          {image.prompt}
                                        </p>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Dynamic hint based on uploaded images count */}
                    {referenceImageUrls.length > 0 && (
                      <p className="text-muted-foreground text-xs">
                        {referenceImageUrls.length === 1
                          ? t('form.reference_image_hint_single')
                          : t('form.reference_image_hint_merge', { count: referenceImageUrls.length })}
                      </p>
                    )}

                    {/* Show hint when model doesn't support multi-image */}
                    {!allowMultipleImages && referenceImageUrls.length === 1 && (
                      <p className="text-muted-foreground text-xs">
                        {t('form.reference_image_hint_pro_only')}
                      </p>
                    )}

                    {hasReferenceUploadError && (
                      <p className="text-destructive text-xs">
                        {t('form.some_images_failed_to_upload')}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="image-prompt" className="text-sm font-medium">{t('form.prompt')}</Label>
                  <Textarea
                    id="image-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('form.prompt_placeholder')}
                    className="min-h-28 bg-background/50 border-border/50 focus:border-primary/50 resize-none transition-colors"
                  />
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span className={promptLength > MAX_PROMPT_LENGTH * 0.8 ? 'text-yellow-500' : ''}>
                      {promptLength} / {MAX_PROMPT_LENGTH}
                    </span>
                    {isPromptTooLong && (
                      <span className="text-destructive font-medium">
                        {t('form.prompt_too_long')}
                      </span>
                    )}
                  </div>
                </div>

                {!isMounted ? (
                  <Button className="w-full" disabled size="lg">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading')}
                  </Button>
                ) : isCheckSign ? (
                  <Button className="w-full" disabled size="lg">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('checking_account')}
                  </Button>
                ) : user ? (
                  <Button
                    size="lg"
                    className="w-full h-12 btn-cosmic text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                    onClick={handleGenerate}
                    disabled={
                      isGenerating ||
                      !prompt.trim() ||
                      isPromptTooLong ||
                      isReferenceUploading ||
                      hasReferenceUploadError
                    }
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
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setIsShowSignModal(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {t('sign_in_to_generate')}
                  </Button>
                )}

                {!isMounted ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('credits_cost', { credits: costCredits })}
                    </span>
                    <span>{t('credits_remaining', { credits: 0 })}</span>
                  </div>
                ) : user && remainingCredits > 0 ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary">
                      {t('credits_cost', { credits: costCredits })}
                    </span>
                    <span>
                      {t('credits_remaining', { credits: remainingCredits })}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary">
                        {t('credits_cost', { credits: costCredits })}
                      </span>
                      <span>
                        {t('credits_remaining', { credits: remainingCredits })}
                      </span>
                    </div>
                    <Link href="/pricing">
                      <Button variant="outline" className="w-full" size="lg">
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t('buy_credits')}
                      </Button>
                    </Link>
                  </div>
                )}

                {isGenerating && (
                  <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-primary">{t('progress')}</span>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    {taskStatusLabel && (
                      <p className="text-muted-foreground text-center text-xs animate-pulse">
                        {taskStatusLabel}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Output Card */}
            <Card className="glass-cosmic border-border/50 shadow-xl shadow-primary/5 animate-in-3">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10">
                    <ImageIcon className="h-4 w-4 text-cyan-500" />
                  </div>
                  {t('generated_images')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                {/* Comparison View - Show when we have original and generated images */}
                {originalImageForComparison && generatedImages.length > 0 ? (
                  <div className="space-y-4">
                    {/* Comparison Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10">
                          <ArrowLeftRight className="h-4 w-4 text-cyan-500" />
                        </div>
                        <span className="text-sm font-medium">{t('comparison.title')}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        onClick={handleClearComparison}
                        title={t('comparison.close')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Comparison Slider */}
                    <div
                      className="relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted/30 cursor-col-resize select-none"
                      onMouseMove={handleSliderMouseMove}
                      onMouseUp={handleSliderMouseUp}
                      onMouseLeave={handleSliderMouseUp}
                      onTouchMove={handleSliderTouchMove}
                      onTouchEnd={handleSliderMouseUp}
                    >
                      {/* After Image (Full) */}
                      <img
                        src={generatedImages[0].url}
                        alt={t('comparison.after')}
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />

                      {/* Before Image (Clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${comparisonSliderPosition}%` }}
                      >
                        <img
                          src={originalImageForComparison}
                          alt={t('comparison.before')}
                          className="absolute inset-0 h-full w-full object-cover"
                          style={{ width: `${100 / (comparisonSliderPosition / 100)}%`, maxWidth: 'none' }}
                          draggable={false}
                        />
                      </div>

                      {/* Slider Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
                        style={{ left: `${comparisonSliderPosition}%`, transform: 'translateX(-50%)' }}
                        onMouseDown={handleSliderMouseDown}
                        onTouchStart={() => setIsDraggingSlider(true)}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <ArrowLeftRight className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                        {t('comparison.before')}
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-xs font-medium">
                        {t('comparison.after')}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 h-9 bg-white/90 hover:bg-white text-black shadow"
                        onClick={() => handleEditImage(generatedImages[0])}
                      >
                        <Pencil className="h-4 w-4 mr-1.5" />
                        <span className="text-xs font-medium">{t('edit')}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 h-9 bg-white/90 hover:bg-white text-black shadow"
                        onClick={() => handleDownloadImage(generatedImages[0])}
                        disabled={downloadingImageId === generatedImages[0].id}
                      >
                        {downloadingImageId === generatedImages[0].id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1.5" />
                            <span className="text-xs font-medium">{t('download')}</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Hint */}
                    <p className="text-xs text-muted-foreground text-center">
                      {t('comparison.hint')}
                    </p>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div
                    className={
                      generatedImages.length === 1
                        ? 'grid grid-cols-1 gap-4'
                        : 'grid gap-4 sm:grid-cols-2'
                    }
                  >
                    {generatedImages.map((image) => (
                      <div key={image.id} className="group relative">
                        <div
                          className={cn(
                            'relative overflow-hidden rounded-xl border border-border/50 bg-muted/30 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10',
                            generatedImages.length === 1 ? '' : 'aspect-square'
                          )}
                        >
                          <LazyImage
                            src={image.url}
                            alt={image.prompt || 'Generated image'}
                            className={
                              generatedImages.length === 1
                                ? 'h-auto w-full'
                                : 'h-full w-full object-cover'
                            }
                          />

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="absolute right-2 bottom-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 px-3 bg-white/90 hover:bg-white text-black shadow-lg"
                              onClick={() => handleEditImage(image)}
                              title={t('edit_this_image')}
                            >
                              <Pencil className="h-4 w-4 mr-1.5" />
                              <span className="text-xs font-medium">{t('edit')}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-9 px-3 bg-white/90 hover:bg-white text-black shadow-lg"
                              onClick={() => handleDownloadImage(image)}
                              disabled={downloadingImageId === image.id}
                            >
                              {downloadingImageId === image.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-1.5" />
                                  <span className="text-xs font-medium">{t('download')}</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Palette className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{t('style_suggestions')}</span>
                    </div>

                    {/* Style chips grid */}
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {STYLE_SUGGESTIONS.map((style) => (
                        <button
                          key={style.labelKey}
                          onClick={() => {
                            const currentPrompt = prompt.trim();
                            const newPrompt = currentPrompt
                              ? `${currentPrompt}, ${style.promptSuffix}`
                              : style.promptSuffix;
                            setPrompt(newPrompt);
                          }}
                          className="group flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                        >
                          <span className="text-base shrink-0">{style.emoji}</span>
                          <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground truncate">
                            {t(`styles.${style.labelKey}`)}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Tip section */}
                    <div className="mt-auto pt-4 border-t border-border/30">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Wand2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                        <p>{t('style_tip')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
