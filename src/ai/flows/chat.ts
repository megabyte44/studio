'use server';
/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a chat conversation turn.
 * - ChatInputSchema - The input type for the chat function.
 * - ChatOutputSchema - The return type for the chat function.
 * - ChatMessageSchema - The schema for a single message in the history.
 */

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatInputSchema = z.object({
  history: z.array(ChatMessageSchema),
  message: z.string(),
  apiKey: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  content: z.string(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

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

  const model = requestAi.model('gemini-2.0-flash');

  const history = input.history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
  }));

  const response = await model.generate({
    prompt: input.message,
    history,
  });

  return { content: response.text };
}
