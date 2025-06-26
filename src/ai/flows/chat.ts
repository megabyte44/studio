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

  // To fix a persistent build error with the `history` parameter, we will format the entire
  // conversation history as a single string and prepend it to the prompt.
  // This is a robust way to provide context and resolves the type ambiguity.
  
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

  const response = await requestAi.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: fullPrompt,
  });

  return { content: response.text };
}
