'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
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

export function ComposeForm() {
  const [fromEmail, setFromEmail] = useState('support@nanobananastudio.com');
  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toEmail.trim()) {
      toast.error('Please enter recipient email');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter message content');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromEmail,
          toEmail,
          toName: toName || undefined,
          subject,
          textContent: content,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email sent successfully');
        router.push('/admin/emails');
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send email');
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="toEmail">Recipient Email *</Label>
          <Input
            id="toEmail"
            type="email"
            placeholder="customer@example.com"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toName">Recipient Name (optional)</Label>
          <Input
            id="toName"
            type="text"
            placeholder="John Doe"
            value={toName}
            onChange={(e) => setToName(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          type="text"
          placeholder="Email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Message *</Label>
        <Textarea
          id="content"
          placeholder="Write your message here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="resize-none"
          disabled={isLoading}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/emails')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
