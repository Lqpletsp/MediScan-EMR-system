// src/ai/dev.ts
import { config } from 'dotenv';
config();

import '@/ai/flows/enhance-image-detection-prompt.ts';
import '@/ai/flows/generate-diagnosis-summary.ts';
import '@/ai/flows/dental-xray-analysis.ts';
