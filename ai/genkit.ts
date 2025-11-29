import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins = [];
// Only initialize the Google AI plugin if an API key is provided in the environment.
// This prevents errors during development if a key is not set.
if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
  plugins.push(googleAI());
}

export const ai = genkit({
  plugins: plugins,
  model: 'googleai/gemini-2.0-flash',
});
