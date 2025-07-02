
'use server';

/**
 * @fileOverview A conversational AI agent.
 *
 * - chat - A function that handles a chat conversation turn.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ChatMessage } from '@/types';
import type { MessageData } from 'genkit';

const ChatFlowInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional(),
  message: z.string(),
  userData: z.string().optional(),
});

const ChatFlowOutputSchema = z.object({
  content: z.string(),
});

export const chat = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  async (input) => {
    const history: ChatMessage[] = input.history || [];
    const messages: MessageData[] = history.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
    }));

    const systemInstruction = `You are LifeOS, an AI assistant. Respond concisely. Give clear, concise explanations in simple language. Avoid complex words and unnecessary details. Use bullet points or short paragraphs. Keep answers easy to read and under 5 sentences when possible.${input.userData ? `

The user has provided the following data from their LifeOS app. Use this data to answer their questions. Be helpful and proactive. Today's date is ${new Date().toISOString().split('T')[0]}.

USER DATA:
${input.userData}` : ''}`;
    
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: systemInstruction,
      history: messages,
      prompt: input.message,
    });
    
    return { content: response.text };
  }
);
