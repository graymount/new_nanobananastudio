'use client';

import { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Button } from '@/shared/components/ui/button';
import { FileText, Code } from 'lucide-react';

interface EmailContentProps {
  htmlContent: string | null;
  textContent: string | null;
}

/**
 * Email content display component with XSS protection.
 * Uses DOMPurify to sanitize HTML content before rendering.
 */
export function EmailContent({ htmlContent, textContent }: EmailContentProps) {
  const [showHtml, setShowHtml] = useState(!!htmlContent);

  if (!htmlContent && !textContent) {
    return <p className="text-muted-foreground italic">No content</p>;
  }

  // Sanitize HTML content using DOMPurify to prevent XSS attacks
  const sanitizedHtml = htmlContent
    ? DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: [
          'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
          'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'img', 'hr',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target'],
        ALLOW_DATA_ATTR: false,
      })
    : null;

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {htmlContent && textContent && (
        <div className="flex gap-2 mb-4">
          <Button
            variant={showHtml ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHtml(true)}
          >
            <Code className="mr-2 h-4 w-4" />
            HTML
          </Button>
          <Button
            variant={!showHtml ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowHtml(false)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Plain Text
          </Button>
        </div>
      )}

      {showHtml && sanitizedHtml ? (
        <div
          // Content is sanitized using DOMPurify above
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          className="email-content"
        />
      ) : textContent ? (
        <pre className="whitespace-pre-wrap font-sans text-sm">
          {textContent}
        </pre>
      ) : (
        <p className="text-muted-foreground italic">No content</p>
      )}
    </div>
  );
}
