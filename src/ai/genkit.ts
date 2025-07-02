'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {genkitNext} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI(), genkitNext()],
});
