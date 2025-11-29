// src/ai/flows/enhance-image-detection-prompt.ts
'use server';
/**
 * @fileOverview An AI tool that suggests keywords and phrases for image detection prompts.
 *
 * - enhanceImageDetectionPrompt - A function that enhances image detection prompts.
 * - EnhanceImageDetectionPromptInput - The input type for the enhanceImageDetectionPrompt function.
 * - EnhanceImageDetectionPromptOutput - The return type for the enhanceImageDetectionPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceImageDetectionPromptInputSchema = z.object({
  imageType: z.string().describe('The type of the image (e.g., X-ray, MRI, CT scan).'),
  aiModelCapabilities: z.string().describe('The capabilities of the AI model being used.'),
  userPrompt: z.string().describe('The user-provided prompt for image detection.'),
});
export type EnhanceImageDetectionPromptInput = z.infer<typeof EnhanceImageDetectionPromptInputSchema>;

const EnhanceImageDetectionPromptOutputSchema = z.object({
  suggestedKeywords: z.array(z.string()).describe('An array of suggested keywords for the prompt.'),
  suggestedPhrases: z.array(z.string()).describe('An array of suggested phrases for the prompt.'),
  enhancedPrompt: z.string().describe('An enhanced prompt incorporating the suggested keywords and phrases.'),
});
export type EnhanceImageDetectionPromptOutput = z.infer<typeof EnhanceImageDetectionPromptOutputSchema>;

export async function enhanceImageDetectionPrompt(input: EnhanceImageDetectionPromptInput): Promise<EnhanceImageDetectionPromptOutput> {
  return enhanceImageDetectionPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceImageDetectionPrompt',
  input: {schema: EnhanceImageDetectionPromptInputSchema},
  output: {schema: EnhanceImageDetectionPromptOutputSchema},
  prompt: `You are an AI prompt enhancement tool for medical image detection.

You will receive the following information:
- Image Type: {{{imageType}}}
- AI Model Capabilities: {{{aiModelCapabilities}}}
- User Prompt: {{{userPrompt}}}

Based on this information, suggest relevant keywords and phrases that can improve the image detection prompt.
Also, generate an enhanced prompt incorporating the suggested keywords and phrases.

Output the suggested keywords in a JSON array under the key "suggestedKeywords".
Output the suggested phrases in a JSON array under the key "suggestedPhrases".
Output the enhanced prompt under the key "enhancedPrompt".

Ensure the output is a valid JSON object.
`,
});

const enhanceImageDetectionPromptFlow = ai.defineFlow(
  {
    name: 'enhanceImageDetectionPromptFlow',
    inputSchema: EnhanceImageDetectionPromptInputSchema,
    outputSchema: EnhanceImageDetectionPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
