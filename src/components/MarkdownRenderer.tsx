'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Function to parse inline markdown (bold, italic, inline code)
// This is now recursive to handle nested formatting.
const parseInline = (text: string): React.ReactNode => {
  const inlineRegex = /(\*\*.*?\*\*)|(_.*?_)|(\*.*?\*)|(`.*?`)/g;
  const parts = text.split(inlineRegex);

  if (parts.length <= 1) {
    return text;
  }

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold: recursively parse content inside
      return <strong key={index}>{parseInline(part.slice(2, -2))}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      // Italic: recursively parse content inside
      return <em key={index}>{parseInline(part.slice(1, -1))}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      // Inline code
      return (
        <code key={index} className="bg-muted text-card-foreground font-code px-1 py-0.5 rounded-sm text-sm">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Plain text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};


/**
 * A component to render markdown content.
 * Supports:
 * - Code blocks (```) with language specifiers
 * - Unordered lists (*, -, +)
 * - Ordered lists (1., 2.)
 * - Bold text (**)
 * - Italic text (* or _)
 * - Inline code (`)
 */
export const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks ```
    if (line.startsWith('```')) {
      const language = line.substring(3).trim();
      const codeLines = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('```')) {
        codeLines.push(lines[j]);
        j++;
      }
      elements.push(
        <div key={`code-block-${i}`} className="my-2 rounded-md border bg-muted font-code text-sm">
          {language && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b">
              <span className="text-xs text-muted-foreground">{language}</span>
            </div>
          )}
          <pre className="p-3 whitespace-pre-wrap break-words overflow-x-auto">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i = j + 1;
      continue;
    }

    // Unordered lists
    if (line.match(/^(\*|-|\+) /)) {
      const listItems = [];
      let j = i;
      while (j < lines.length && lines[j].match(/^(\*|-|\+) /)) {
        listItems.push(
          <li key={`ul-li-${j}`}>
            {parseInline(lines[j].substring(2))}
          </li>
        );
        j++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc list-outside space-y-1 my-2 pl-5">{listItems}</ul>);
      i = j;
      continue;
    }
    
    // Ordered lists
    if (line.match(/^\d+\. /)) {
      const listItems = [];
      let j = i;
      while (j < lines.length && lines[j].match(/^\d+\. /)) {
        listItems.push(
          <li key={`ol-li-${j}`}>
            {parseInline(lines[j].replace(/^\d+\. /, ''))}
          </li>
        );
        j++;
      }
      elements.push(<ol key={`ol-${i}`} className="list-decimal list-outside space-y-1 my-2 pl-5">{listItems}</ol>);
      i = j;
      continue;
    }

    // Paragraphs
    if (line.trim() !== '') {
       elements.push(<p key={`p-${i}`}>{parseInline(line)}</p>);
    }

    i++;
  }

  return <div className="flex flex-col gap-2">{elements}</div>;
};
