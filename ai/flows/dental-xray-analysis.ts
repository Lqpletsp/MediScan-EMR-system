
'use server';
/**
 * @fileOverview An AI tool for analyzing dental X-rays.
 *
 * - dentalXrayAnalysis - A function that analyzes a dental x-ray, highlights issues, and provides a report.
 * - DentalXrayAnalysisInput - The input type for the dentalXrayAnalysis function.
 * - DentalXrayAnalysisOutput - The return type for the dentalXrayAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DentalXrayAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A dental X-ray, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  patientDetails: z.string().describe('The description of the patient.'),
});
export type DentalXrayAnalysisInput = z.infer<typeof DentalXrayAnalysisInputSchema>;


const FindingSchema = z.object({
    description: z.string().describe("A detailed description of the finding for this area."),
});

const DentalXrayAnalysisOutputSchema = z.object({
  highlightedImageDataUri: z
    .string()
    .describe(
      "The highlighted dental X-ray, as a data URI that must include a MIME type and use Base64 encoding."
    ),
  summary: z.string().describe("A summary of the findings."),
  confidenceScore: z.enum(["High", "Medium", "Low"]).describe("The confidence level of the analysis."),
  findings: z.array(FindingSchema).describe("An array of specific dental findings."),
});
export type DentalXrayAnalysisOutput = z.infer<typeof DentalXrayAnalysisOutputSchema>;

export async function dentalXrayAnalysis(input: DentalXrayAnalysisInput): Promise<DentalXrayAnalysisOutput> {
  return dentalXrayAnalysisFlow(input);
}

const dentalXrayAnalysisFlow = ai.defineFlow(
  {
    name: 'dentalXrayAnalysisFlow',
    inputSchema: DentalXrayAnalysisInputSchema,
    outputSchema: DentalXrayAnalysisOutputSchema,
  },
  async (input) => {
    
    const analysisPrompt = ai.definePrompt({
        name: 'dentalAnalysisPrompt',
        input: { schema: DentalXrayAnalysisInputSchema },
        output: { schema: z.object({
            summary: z.string().describe("A summary of the findings."),
            confidenceScore: z.enum(["High", "Medium", "Low"]).describe("The confidence level of the analysis (High, Medium, or Low)."),
            findings: z.array(FindingSchema).describe("An array of specific dental findings."),
        })},
        prompt: `You are an expert dental radiologist. Analyze the provided dental X-ray for a patient with the following details: {{{patientDetails}}}.
        
        Identify all potential issues, such as cavities, decay, impaction, infections, or other anomalies.
        
        Provide a concise summary, a detailed list of findings, and a confidence score for your analysis.
        
        Image: {{media url=photoDataUri}}`,
    });

    const [analysisResponse, imageResponse] = await Promise.all([
        analysisPrompt(input),
        ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: [
              {media: {url: input.photoDataUri}},
              {text: 'You are an expert dental radiologist. Analyze the provided dental X-ray. Identify only the abnormal parts, such as cavities, decay, impaction, or infections. Highlight only these identified problematic areas on the image using thin, subtle, translucent red circles or outlines. Do not highlight normal, healthy areas. The highlighting should be minimal and precise. Return the modified image.'},
            ],
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
        }),
    ]);
    
    if (!analysisResponse.output) {
        throw new Error("Failed to get a response from the text analysis model.");
    }
    if (!imageResponse.media?.url) {
        throw new Error("Failed to get a response from the image generation model.");
    }

    return {
        ...analysisResponse.output,
        highlightedImageDataUri: imageResponse.media.url,
    };
  }
);
