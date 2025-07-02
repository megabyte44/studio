
// TagExpenseWithAI Story: As a user, I want the application to automatically categorize my expenses using AI, so I can easily track and analyze my spending habits without manually tagging each transaction.

'use server';

/**
 * @fileOverview An AI agent that categorizes expenses using LLM.
 *
 * - tagExpense - A function that categorizes an expense.
 * - TagExpenseInput - The input type for the tagExpense function.
 * - TagExpenseOutput - The return type for the tagExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const { generate } = ai;

const TagExpenseInputSchema = z.object({
  description: z.string().describe('The description of the expense.'),
  amount: z.number().describe('The amount of the expense.'),
});
export type TagExpenseInput = z.infer<typeof TagExpenseInputSchema>;

const TagExpenseOutputSchema = z.object({
  category: z.string().describe('The category of the expense.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});
export type TagExpenseOutput = z.infer<typeof TagExpenseOutputSchema>;

export async function tagExpense(input: TagExpenseInput): Promise<TagExpenseOutput> {
  return tagExpenseFlow(input);
}

const tagExpenseFlow = ai.defineFlow(
  {
    name: 'tagExpenseFlow',
    inputSchema: TagExpenseInputSchema,
    outputSchema: TagExpenseOutputSchema,
  },
  async input => {
    const promptText = `You are an expert financial advisor. Your job is to categorize expenses based on their description and amount.

  Description: ${input.description}
  Amount: ${input.amount}

  Respond with JSON object conforming to specified schema, and include a confidence score between 0 and 1. Category should be a simple, single-word label such as "Food", "Transportation", or "Entertainment".`;

    const { output } = await generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: promptText,
        output: {
            schema: TagExpenseOutputSchema,
        },
    });
    
    return output!;
  }
);
