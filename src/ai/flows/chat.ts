'use server';
/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a chat conversation turn.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { ChatInput, ChatOutput } from '@/types';

export async function chat(input: ChatInput): Promise<ChatOutput> {
  if (!input.apiKey) {
    throw new Error('Google AI API key is required. Please set it in the settings.');
  }

  // Create a temporary, request-scoped Genkit instance.
  // This is necessary to handle a user-provided API key that is not
  // available in the server's environment variables.
  const requestAi = genkit({
    plugins: [googleAI({ apiKey: input.apiKey })],
  });

  const history = input.history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
  }));

  const response = await requestAi.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: input.message,
    history,
  });

  return { content: response.text };
}
