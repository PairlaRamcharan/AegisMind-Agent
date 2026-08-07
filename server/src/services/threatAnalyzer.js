import { getAiClient, CLASSIFIER_MODEL, SYSTEM_PROMPT } from './geminiClient.js';
import { db } from '../config/db.js';

export const threatClassificationSchema = {
  type: "object",
  properties: {
    isThreat: { type: "boolean" },
    threatCategory: { 
      type: "string", 
      description: "OWASP category e.g. SQL Injection, XSS, RCE, IDOR, SSRF, Command Injection, or None" 
    },
    confidenceScore: { type: "number", description: "Float between 0.00 and 1.00" },
    riskLevel: { 
      type: "string", 
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "BENIGN"] 
    },
    technicalExplanation: { type: "string", description: "Concise analysis of the detected exploit vector." },
    suggestedMitigation: { type: "string", description: "Immediate defensive action recommendation." }
  },
  required: ["isThreat", "threatCategory", "confidenceScore", "riskLevel", "technicalExplanation", "suggestedMitigation"]
};

// High-speed heuristic fallback when AI API key is omitted or unreachable
function performHeuristicAnalysis({ ip, method, endpoint, headers, payload }) {
  const combined = (endpoint + ' ' + JSON.stringify(headers) + ' ' + JSON.stringify(payload)).toLowerCase();

  if (combined.includes('union select') || combined.includes("or '1'='1") || combined.includes('--') || combined.includes('drop table')) {
    return {
      isThreat: true,
      threatCategory: 'SQL Injection',
      confidenceScore: 0.98,
      riskLevel: 'CRITICAL',
      technicalExplanation: 'Detected SQL syntax injection attempting unauthorized database query execution.',
      suggestedMitigation: 'Enforce parameterized database queries and strict input sanitization.'
    };
  }

  if (combined.includes('; cat /etc/passwd') || combined.includes('| whoami') || combined.includes('&& net localgroup')) {
    return {
      isThreat: true,
      threatCategory: 'Command Injection',
      confidenceScore: 0.96,
      riskLevel: 'CRITICAL',
      technicalExplanation: 'Detected shell command separator and OS command execution sequence.',
      suggestedMitigation: 'Avoid shell execution helpers (`child_process.exec`) and sanitize system arguments.'
    };
  }

  if (combined.includes('<script>') || combined.includes('javascript:') || combined.includes('onerror=alert')) {
    return {
      isThreat: true,
      threatCategory: 'XSS',
      confidenceScore: 0.92,
      riskLevel: 'HIGH',
      technicalExplanation: 'Detected script tag / event handler payload for Cross-Site Scripting.',
      suggestedMitigation: 'Encode all HTML outputs and enforce Content Security Policy (CSP).'
    };
  }

  if (combined.includes('169.254.169.254') || combined.includes('localhost:6379')) {
    return {
      isThreat: true,
      threatCategory: 'SSRF',
      confidenceScore: 0.94,
      riskLevel: 'HIGH',
      technicalExplanation: 'Detected cloud metadata / internal service IP targeted via HTTP request.',
      suggestedMitigation: 'Restrict server-side outbound HTTP requests using strict URL host allowlist.'
    };
  }

  if (combined.includes('../') || combined.includes('..\\') || combined.includes('/etc/passwd')) {
    return {
      isThreat: true,
      threatCategory: 'IDOR',
      confidenceScore: 0.89,
      riskLevel: 'MEDIUM',
      technicalExplanation: 'Detected path traversal pattern targeting restricted file system resources.',
      suggestedMitigation: 'Validate file access against authorization policies and normalize path inputs.'
    };
  }

  return {
    isThreat: false,
    threatCategory: 'None',
    confidenceScore: 0.02,
    riskLevel: 'BENIGN',
    technicalExplanation: 'Request payload contains standard user parameters with zero malicious signatures.',
    suggestedMitigation: 'No defensive action required.'
  };
}

export async function analyzeThreat({ ip, method, endpoint, headers, payload }) {
  const settings = await db.getSettings();
  const aiClient = getAiClient(settings?.geminiApiKey);

  if (!aiClient) {
    return performHeuristicAnalysis({ ip, method, endpoint, headers, payload });
  }

  try {
    const promptText = `Analyze the following incoming HTTP request telemetry payload for malicious security threats, exploit signatures, and zero-day attack patterns.
Request Details:
Method: ${method}
Endpoint: ${endpoint}
Headers: ${JSON.stringify(headers)}
Body/Query Payload: ${JSON.stringify(payload)}
Source IP: ${ip}`;

    const response = await aiClient.models.generateContent({
      model: CLASSIFIER_MODEL,
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${promptText}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: threatClassificationSchema,
        temperature: 0.1
      }
    });

    const resultText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    return {
      isThreat: Boolean(parsed.isThreat),
      threatCategory: parsed.threatCategory || 'None',
      confidenceScore: Number(parsed.confidenceScore) || 0.0,
      riskLevel: parsed.riskLevel || 'BENIGN',
      technicalExplanation: parsed.technicalExplanation || '',
      suggestedMitigation: parsed.suggestedMitigation || ''
    };
  } catch (err) {
    console.warn('⚠️ Gemini AI Threat Classification failed, falling back to heuristic analysis:', err.message);
    return performHeuristicAnalysis({ ip, method, endpoint, headers, payload });
  }
}
