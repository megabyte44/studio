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

  let systemPrompt = "Respond concisely. Give clear, concise explanations in simple language. Avoid complex words and unnecessary details. Use bullet points or short paragraphs. Keep answers easy to read and under 5 sentences when possible.";

  if (input.userData) {
    systemPrompt += `\n\nThe user has provided the following data from their LifeOS app. Use this data to answer their questions. Be helpful and proactive. Today's date is ${new Date().toDateString()}.\n\nUSER DATA:\n${input.userData}`;
  }

  const response = await requestAi.generate({
    model: 'googleai/gemini-2.0-flash',
    system: systemPrompt,
    prompt: input.message,
    history,
  });

  return { content: response.text };
}
