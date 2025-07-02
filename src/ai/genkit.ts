import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { next as genkitNext } from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI(), genkitNext()],
});
