'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Send, Loader2 } from 'lucide-react';

// Available sender emails
const SENDER_OPTIONS = [
  { value: 'support@nanobananastudio.com', label: 'Support <support@nanobananastudio.com>' },
  { value: 'alex.king@nanobananastudio.com', label: 'Alex King, CEO <alex.king@nanobananastudio.com>' },
];

interface ReplyFormProps {
  emailId: string;
  defaultFromEmail?: string;
}

export function ReplyForm({ emailId, defaultFromEmail }: ReplyFormProps) {
  // Use defaultFromEmail if it's a valid sender option, otherwise fall back to support@
  const validDefault = SENDER_OPTIONS.some(opt => opt.value === defaultFromEmail)
    ? defaultFromEmail
    : 'support@nanobananastudio.com';
  const [fromEmail, setFromEmail] = useState(validDefault);
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
          fromEmail,
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
      <div className="space-y-2">
        <Label htmlFor="fromEmail">From</Label>
        <Select value={fromEmail} onValueChange={setFromEmail} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select sender email" />
          </SelectTrigger>
          <SelectContent>
            {SENDER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Message</Label>
        <Textarea
          id="content"
          placeholder="Write your reply here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="resize-none"
          disabled={isLoading}
        />
      </div>
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
