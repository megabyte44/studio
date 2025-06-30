
'use server';

/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a chat conversation turn.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ChatInput, ChatOutput, ChatMessage } from '@/types';
import type { MessageData } from 'genkit';

const ChatPromptInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional(),
  message: z.string(),
  userData: z.string().optional(),
});

export async function chat(input: Omit<ChatInput, 'apiKey'>): Promise<ChatOutput> {
  const promptInput = {
    history: input.history || [],
    message: input.message,
    userData: input.userData,
  };
  const response = await chatPrompt(promptInput);
  return { content: response.text };
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatPromptInputSchema },
  model: 'googleai/gemini-2.0-flash',

  // The 'system' property is the correct place for system-level instructions.
  // We use handlebars to conditionally include user data.
  system: `You are LifeOS, an AI assistant. Respond concisely. Give clear, concise explanations in simple language. Avoid complex words and unnecessary details. Use bullet points or short paragraphs. Keep answers easy to read and under 5 sentences when possible.
{{#if userData}}

The user has provided the following data from their LifeOS app. Use this data to answer their questions. Be helpful and proactive. Today's date is ${new Date().toISOString().split('T')[0]}.

USER DATA:
{{{userData}}}
{{/if}}`,

  // The prompt can be a function that returns an array of MessageData,
  // which is perfect for chat applications.
  prompt: (input) => {
    const history: ChatMessage[] = input.history || [];

    const messages: MessageData[] = history.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
    }));

    messages.push({
      role: 'user',
      content: [{ text: input.message }]
    });
    
    // Returning an array of MessageData from the prompt function
    // is the way to construct a chat history for the model.
    return messages;
  }
});
