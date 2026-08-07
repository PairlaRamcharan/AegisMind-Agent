import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const CLASSIFIER_MODEL = 'gemini-2.5-flash';
export const REMEDIATION_MODEL = 'gemini-2.5-pro';

export function getAiClient(customApiKey) {
  const key = customApiKey || process.env.GEMINI_API_KEY;
  if (!key || key === 'your_actual_gemini_api_key_here') {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err.message);
    return null;
  }
}

export const SYSTEM_PROMPT = `You are AegisMind-Core, an autonomous zero-trust cyber defense engine.
Your sole mission is to analyze incoming HTTP request telemetry, evaluate semantic security risks, categorize attack vectors according to OWASP Top 10 standards, and output AST-compliant source code fixes.

Strict Directives:
1. Return strictly valid JSON conforming exactly to the user-provided schema.
2. Never output explanatory markdown commentary or prose outside the JSON payload.
3. Be ultra-precise with risk severity scoring (CRITICAL, HIGH, MEDIUM, LOW, BENIGN).
4. Code patches MUST be production-ready, defensively engineered, fully syntactically valid Node.js/JavaScript code, and retain functional compatibility while neutralizing the threat vector completely.`;
