'use server';
/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a chat conversation turn.
 */

import { ai } from '@/ai/genkit';
import type { ChatInput, ChatOutput } from '@/types';

// The API key is now handled server-side via environment variables in genkit.ts
// We no longer need to pass it from the client.

export async function chat(input: Omit<ChatInput, 'apiKey'>): Promise<ChatOutput> {
  let fullPrompt = 'Respond concisely. Give clear, concise explanations in simple language. Avoid complex words and unnecessary details. Use bullet points or short paragraphs. Keep answers easy to read and under 5 sentences when possible.';

  if (input.userData) {
    fullPrompt += `\n\nThe user has provided the following data from their LifeOS app. Use this data to answer their questions. Be helpful and proactive. Today's date is ${new Date().toDateString()}.\n\nUSER DATA:\n${input.userData}`;
  }

  // Prepend the formatted history to the prompt
  if (input.history && input.history.length > 0) {
    const historyText = input.history
      .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');
    fullPrompt += `\n\n--- PREVIOUS CONVERSATION ---\n${historyText}`;
  }

  // Add the current message
  fullPrompt += `\n\n--- CURRENT MESSAGE ---\nUser: ${input.message}`;

  const response = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: fullPrompt,
  });

  return { content: response.text };
}
