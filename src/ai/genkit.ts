'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// The genkitNext plugin has been temporarily removed to resolve a build issue.
// We can re-evaluate adding it back after a successful deployment.
// import {genkitNext} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.GOOGLE_API_KEY})],
});
