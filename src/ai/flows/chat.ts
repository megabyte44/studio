'use server';
/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a chat conversation turn.
 */

import { ai } from '@/ai/genkit';
import type { ChatInput, ChatOutput, ChatMessage } from '@/types';

// The API key is now handled server-side via environment variables in genkit.ts.

export async function chat(input: Omit<ChatInput, 'apiKey'>): Promise<ChatOutput> {
  
  let systemPrompt = 'You are LifeOS, an AI assistant. Respond concisely. Give clear, concise explanations in simple language. Avoid complex words and unnecessary details. Use bullet points or short paragraphs. Keep answers easy to read and under 5 sentences when possible.';

  if (input.userData) {
    systemPrompt += `\n\nThe user has provided the following data from their LifeOS app. Use this data to answer their questions. Be helpful and proactive. Today's date is ${new Date().toDateString()}.\n\nUSER DATA:\n${input.userData}`;
  }
  
  // The history from the client already has the correct role ('user' or 'model')
  const history: ChatMessage[] = input.history || [];

  const response = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    system: systemPrompt,
    history: history,
    prompt: input.message,
  });

  return { content: response.text };
}
