import { db } from '../config/db.js';
import { analyzeThreat } from '../services/threatAnalyzer.js';
import { handleHoneypotRedirect } from './honeypotRedirect.js';
import { generateCodePatch } from '../services/patchGenerator.js';
import { verifyPatchInSandbox } from '../services/sandboxRunner.js';

export async function aegisInterceptor(req, res, next) {
  // Skip interceptor for static or explicit telemetry management routes to avoid infinite recursion
  if (req.path.startsWith('/api/v1/telemetry') || req.path.startsWith('/api/v1/quarantine') || req.path.startsWith('/api/v1/remediation') || req.path.startsWith('/api/v1/settings') || req.path.startsWith('/api/v1/auth')) {
    return next();
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();

  // 1. Check if IP is currently quarantined
  const isQuarantined = await db.isIpQuarantined(clientIp);
  if (isQuarantined) {
    return handleHoneypotRedirect(req, res, clientIp, 'IP blocked by AegisMind Zero-Trust Interceptor');
  }

  // 2. Perform Real-Time Semantic AI Threat Analysis
  const method = req.method;
  const endpoint = req.originalUrl || req.url;
  const headers = req.headers || {};
  const payload = req.method === 'GET' ? req.query : req.body || {};

  const analysis = await analyzeThreat({
    ip: clientIp,
    method,
    endpoint,
    headers,
    payload
  });

  const settings = await db.getSettings();
  const threshold = settings?.sensitivityThreshold ?? 0.75;

  // 3. Log Telemetry
  const telemetryRecord = await db.insertTelemetry({
    ip_address: clientIp,
    method,
    endpoint,
    headers,
    payload,
    is_threat: analysis.isThreat,
    threat_category: analysis.threatCategory,
    confidence_score: analysis.confidenceScore,
    risk_level: analysis.riskLevel,
    technicalExplanation: analysis.technicalExplanation,
    suggestedMitigation: analysis.suggestedMitigation
  });

  req.aegisTelemetry = telemetryRecord;

  // 4. Trigger Automatic Defense Actions if Threat > Threshold
  if (analysis.isThreat && analysis.confidenceScore >= threshold) {
    console.warn(`🚨 [THREAT DETECTED] IP: ${clientIp} | OWASP: ${analysis.threatCategory} | Score: ${analysis.confidenceScore} >= Threshold ${threshold}`);

    // Auto-Quarantine IP
    await db.addQuarantine({
      ip_address: clientIp,
      reason: `Automated threat isolation: ${analysis.technicalExplanation}`,
      threat_category: analysis.threatCategory
    });

    // Auto-Log Vulnerability Record
    const vuln = await db.insertVulnerability({
      telemetry_id: telemetryRecord.id,
      title: `${analysis.threatCategory} exploit detected on ${endpoint}`,
      owasp_category: analysis.threatCategory,
      file_path: endpoint.includes('user') ? 'server/src/routes/demoExploits.routes.js' : 'server/src/routes/app.routes.js',
      vulnerable_code: `// Express Endpoint Handler\napp.${method.toLowerCase()}('${endpoint}', async (req, res) => {\n  // Unsanitized payload handling:\n  const payload = ${JSON.stringify(payload)};\n});`,
      severity: analysis.riskLevel
    });

    // Auto-generate patch if autopilot is enabled
    if (settings?.autopilotMode) {
      try {
        const patchData = await generateCodePatch(vuln.id, JSON.stringify(payload));
        const patch = await db.insertCodePatch(patchData);
        await verifyPatchInSandbox(vuln.id, patch.patched_code);
      } catch (err) {
        console.error('Autopilot patch generation error:', err.message);
      }
    }

    // Redirect current malicious request immediately to Honeypot
    return handleHoneypotRedirect(req, res, clientIp, analysis.technicalExplanation);
  }

  next();
}
