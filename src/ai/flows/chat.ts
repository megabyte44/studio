/**
 * @fileOverview A simple AI chat flow.
 *
 * - chat - A function that handles the chat process.
 */

import {ai} from '@/ai/genkit';
import {
    ChatInputSchema,
    ChatOutputSchema,
    type ChatInput,
    type ChatOutput,
    type ChatMessage
} from '@/types';

// Define the flow
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const messages: ChatMessage[] = [...input.history];
    messages.push({ role: 'user', content: input.message });

    const systemInstruction = `You are LifeOS, an AI assistant. Respond concisely. Give clear, concise explanations in simple language. Avoid complex words and unnecessary details. Use bullet points or short paragraphs. Keep answers easy to read and under 5 sentences when possible.${input.userData ? `

The user has provided the following data from their LifeOS app. Use this data to answer their questions. Be helpful and proactive. Today's date is ${new Date().toISOString().split('T')[0]}.

USER DATA:
${input.userData}` : ''}`;
    
    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages,
      ],
      output: {
        schema: ChatOutputSchema,
      },
    });

    const output = response.output;
    if (!output) {
      throw new Error('No output from AI model');
    }

    return output;
  }
);

// Export a wrapper function
export async function chat(input: ChatInput): Promise<ChatOutput> {
    return chatFlow(input);
}