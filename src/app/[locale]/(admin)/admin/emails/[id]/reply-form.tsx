'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface ReplyFormProps {
  emailId: string;
}

export function ReplyForm({ emailId }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/emails/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: emailId,
          textContent: content,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Reply sent successfully');
        setContent('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to send reply');
      }
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Write your reply here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="resize-none"
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !content.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Reply
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
