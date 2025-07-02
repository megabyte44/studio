
'use server';

/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a chat conversation turn.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { MessageData } from 'genkit';

const ChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional(),
  message: z.string(),
  userData: z.string().optional(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  content: z.string(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const history = input.history || [];
    
    const historyMessages: MessageData[] = history.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
    }));

    const systemInstruction = `You are LifeOS, an AI assistant. Respond concisely. Give clear, concise explanations in simple language. Avoid complex words and unnecessary details. Use bullet points or short paragraphs. Keep answers easy to read and under 5 sentences when possible.${input.userData ? `

The user has provided the following data from their LifeOS app. Use this data to answer their questions. Be helpful and proactive. Today's date is ${new Date().toISOString().split('T')[0]}.

USER DATA:
${input.userData}` : ''}`;
    
    const allMessages: MessageData[] = [
      { role: 'system', content: [{ text: systemInstruction }] },
      ...historyMessages,
      { role: 'user', content: [{ text: input.message }] }
    ];

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      messages: allMessages,
    });
    
    return { content: response.text };
  }
);
