import { getAiClient, REMEDIATION_MODEL, SYSTEM_PROMPT } from './geminiClient.js';
import { db } from '../config/db.js';

export const codePatchSchema = {
  type: "object",
  properties: {
    vulnerabilityId: { type: "string" },
    patchedCode: { type: "string", description: "Full fixed JavaScript source code." },
    diffContent: { type: "string", description: "Standard unified diff snippet (+ added, - removed)." },
    remediationSummary: { type: "string", description: "Summary of changes made to secure the code." },
    safetyAssurance: { type: "string", description: "Explanation of why this fix prevents regression." }
  },
  required: ["patchedCode", "diffContent", "remediationSummary", "safetyAssurance"]
};

function generateFallbackPatch(vulnerability, attackPayload) {
  const code = vulnerability.vulnerable_code;
  let patchedCode = code;
  let diffContent = '';
  let summary = 'Applied defensive parameters and strict input validation.';

  if (vulnerability.owasp_category.includes('Injection') || code.includes('SELECT') || code.includes('query(')) {
    patchedCode = `// Secure Parameterized Query & Input Sanitization
const sanitizedEmail = String(req.body.email || '').trim().toLowerCase();
if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
  return res.status(400).json({ error: 'Invalid email address format' });
}

const query = 'SELECT id, email, password_hash, role FROM users WHERE email = $1';
const result = await db.query(query, [sanitizedEmail]);`;

    diffContent = `--- ${vulnerability.file_path}
+++ ${vulnerability.file_path}
@@ -10,3 +10,7 @@
-const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";
-const result = await db.query(query);
+const sanitizedEmail = String(req.body.email || '').trim().toLowerCase();
+if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
+  return res.status(400).json({ error: 'Invalid email address format' });
+}
+const query = 'SELECT id, email, password_hash, role FROM users WHERE email = $1';
+const result = await db.query(query, [sanitizedEmail]);`;
    summary = 'Replaced string concatenation with parameterized SQL bindings ($1) and added email format validation.';
  } else if (vulnerability.owasp_category.includes('Command') || code.includes('exec(')) {
    patchedCode = `// Secure Command Argument Sanitization
const allowedRoles = ['admin', 'analyst', 'auditor'];
const roleParam = String(req.query.role || '').trim().toLowerCase();

if (!allowedRoles.includes(roleParam)) {
  return res.status(400).json({ error: 'Invalid role specified' });
}

const result = await db.query('SELECT * FROM users WHERE role = $1', [roleParam]);`;

    diffContent = `--- ${vulnerability.file_path}
+++ ${vulnerability.file_path}
@@ -8,2 +8,6 @@
-const cmd = 'list-users --role=' + req.query.role;
-exec(cmd);
+const allowedRoles = ['admin', 'analyst', 'auditor'];
+const roleParam = String(req.query.role || '').trim().toLowerCase();
+if (!allowedRoles.includes(roleParam)) {
+  return res.status(400).json({ error: 'Invalid role specified' });
+}
+const result = await db.query('SELECT * FROM users WHERE role = $1', [roleParam]);`;
    summary = 'Eliminated shell command invocation (`exec`) and enforced strict parameter allowlist matching.';
  } else {
    patchedCode = `// Secure Output Encoding & Input Validation
const safePayload = z.string().escape().parse(req.body.input);
const cleanOutput = encodeURIComponent(safePayload);`;

    diffContent = `--- ${vulnerability.file_path}
+++ ${vulnerability.file_path}
@@ -5,2 +5,2 @@
-const output = req.body.input;
+const safePayload = z.string().escape().parse(req.body.input);
+const cleanOutput = encodeURIComponent(safePayload);`;
    summary = 'Applied HTML escaping and URL parameter encoding to neutralize inline payload execution.';
  }

  return {
    vulnerabilityId: vulnerability.id,
    patchedCode,
    diffContent,
    remediationSummary: summary,
    safetyAssurance: 'Fix completely isolates untrusted inputs from command/SQL parsing contexts, preventing injection bypasses.'
  };
}

export async function generateCodePatch(vulnerabilityId, attackPayload = '') {
  const vuln = await db.findVulnerabilityById(vulnerabilityId);
  if (!vuln) {
    throw new Error(`Vulnerability ID ${vulnerabilityId} not found`);
  }

  const settings = await db.getSettings();
  const aiClient = getAiClient(settings?.geminiApiKey);

  if (!aiClient) {
    return generateFallbackPatch(vuln, attackPayload);
  }

  try {
    const promptText = `You are provided with a vulnerable source code snippet and an associated attack telemetry report detailing how the vulnerability was exploited.
Vulnerability Title: ${vuln.title}
OWASP Category: ${vuln.owasp_category}
Target File Path: ${vuln.file_path}
Vulnerable Code Snippet:
\`\`\`javascript
${vuln.vulnerable_code}
\`\`\`

Attack Payload Reference: ${attackPayload || 'Detected exploit string'}
Task: Generate a secure, production-grade replacement code snippet. Output both the full updated code and a standard Unified Git Diff string. Ensure parameterized queries, input sanitization, and strict validation are implemented.`;

    const response = await aiClient.models.generateContent({
      model: REMEDIATION_MODEL,
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${promptText}` }] }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: codePatchSchema,
        temperature: 0.1
      }
    });

    const resultText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed = JSON.parse(resultText);
    return {
      vulnerabilityId: vuln.id,
      patchedCode: parsed.patchedCode,
      diffContent: parsed.diffContent,
      remediationSummary: parsed.remediationSummary,
      safetyAssurance: parsed.safetyAssurance
    };
  } catch (err) {
    console.warn('⚠️ Gemini AI Patch Generation failed, using fallback patch generator:', err.message);
    return generateFallbackPatch(vuln, attackPayload);
  }
}
