'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/shared/components/ui/dialog';
import { Send, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BroadcastFormProps {
  totalUsers: number;
}

export function BroadcastForm({ totalUsers }: BroadcastFormProps) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    sentCount: number;
    failedCount: number;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter message content');
      return;
    }

    setIsDialogOpen(false);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/emails/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromEmail: 'alex.king@nanobananastudio.com',
          subject,
          textContent: content,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: data.success,
          sentCount: data.sentCount,
          failedCount: data.failedCount,
        });

        if (data.success) {
          toast.success(`Successfully sent to ${data.sentCount} users!`);
        } else {
          toast.warning(
            `Sent to ${data.sentCount} users, ${data.failedCount} failed`
          );
        }
      } else {
        toast.error(data.error || 'Failed to send broadcast');
      }
    } catch (error) {
      toast.error('Failed to send broadcast email');
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          {result.success ? (
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          ) : (
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto" />
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {result.success ? 'Broadcast Complete!' : 'Broadcast Completed with Errors'}
        </h3>
        <p className="text-muted-foreground mb-4">
          Successfully sent to {result.sentCount} users
          {result.failedCount > 0 && `, ${result.failedCount} failed`}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/emails')}>
            View Sent Emails
          </Button>
          <Button onClick={() => setResult(null)}>
            Send Another Broadcast
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          type="text"
          placeholder="e.g., Exciting News from Nano Banana Studio!"
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
          placeholder={`Dear valued user,

I'm excited to share some news with you...

Best regards,
Alex King
CEO, Nano Banana Studio`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="resize-none font-mono"
          disabled={isLoading}
          required
        />
        <p className="text-xs text-muted-foreground">
          This message will be sent as plain text to all {totalUsers} registered users.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/emails')}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading || !subject.trim() || !content.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending to {totalUsers} users...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to All Users
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Confirm Broadcast
              </DialogTitle>
              <DialogDescription>
                You are about to send this email to <strong>{totalUsers} users</strong>.
                This action cannot be undone. Are you sure you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Subject:</p>
              <p className="text-sm text-muted-foreground mb-2">{subject}</p>
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-muted-foreground line-clamp-3">{content}</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSubmit}>
                Yes, Send to All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
