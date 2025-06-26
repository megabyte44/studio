'use client';

import React from 'react';

/**
 * A simple component to render markdown for bold text and code blocks.
 * - `**text**` becomes bold.
 * - ```code``` becomes a formatted code block.
 * Expects parent to have `whitespace-pre-wrap`.
 */
export const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  // Split by code blocks first. The regex keeps the delimiters.
  const parts = content.split(/(```[\s\S]*?```)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // This is a code block.
          const code = part.slice(3, -3).trim();
          return (
            <pre key={index} className="bg-muted text-card-foreground rounded-md my-2 p-3 text-sm whitespace-pre-wrap break-all font-code">
              <code>{code}</code>
            </pre>
          );
        }

        // This is a regular text part, process for bold.
        // The regex keeps the delimiters.
        const textParts = part.split(/(\*\*.*?\*\*)/g).filter(Boolean);

        return textParts.map((textPart, textIndex) => {
          if (textPart.startsWith('**') && textPart.endsWith('**')) {
            return <strong key={`${index}-${textIndex}`}>{textPart.slice(2, -2)}</strong>;
          }
          return <React.Fragment key={`${index}-${textIndex}`}>{textPart}</React.Fragment>;
        });
      })}
    </>
  );
};
