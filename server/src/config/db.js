import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'store.json');

// Memory store fallback structure
let localStore = {
  users: [],
  telemetry_logs: [],
  quarantine_list: [],
  vulnerabilities: [],
  code_patches: [],
  settings: {
    sensitivityThreshold: 0.75,
    autopilotMode: false,
    honeypotStrategy: 'FAKE_DATA',
    geminiApiKey: process.env.GEMINI_API_KEY || ''
  }
};

let usePg = false;
let pool = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalStore() {
  ensureDataDir();
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      localStore = { ...localStore, ...JSON.parse(data) };
    } catch (err) {
      console.warn('⚠️ Could not parse local store.json, using default seed store:', err.message);
    }
  }
}

function saveLocalStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Failed to persist local store:', err.message);
  }
}

async function seedInitialData() {
  const adminPasswordHash = await bcrypt.hash('Password123!', 10);
  const analystPasswordHash = await bcrypt.hash('Password123!', 10);

  if (localStore.users.length === 0) {
    localStore.users.push(
      {
        id: crypto.randomUUID(),
        email: 'admin@aegismind.io',
        password_hash: adminPasswordHash,
        role: 'ADMIN',
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        email: 'analyst@aegismind.io',
        password_hash: analystPasswordHash,
        role: 'ANALYST',
        created_at: new Date().toISOString()
      }
    );
  }

  if (localStore.telemetry_logs.length === 0) {
    const sampleLogs = [
      {
        id: crypto.randomUUID(),
        ip_address: '198.51.100.42',
        method: 'POST',
        endpoint: '/api/v1/auth/login',
        headers: { 'user-agent': 'Mozilla/5.0 ExploitScanner/2.0' },
        payload: { username: "' UNION SELECT username, password FROM users --", password: "123" },
        is_threat: true,
        threat_category: 'SQL Injection',
        confidence_score: 0.98,
        risk_level: 'CRITICAL',
        technicalExplanation: 'Classic UNION-based SQL injection targeting authentication credentials.',
        suggestedMitigation: 'Use parameterized SQL queries and input validation.',
        processed_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        id: crypto.randomUUID(),
        ip_address: '203.0.113.195',
        method: 'GET',
        endpoint: '/api/v1/users?role=admin; cat /etc/passwd',
        headers: { 'user-agent': 'curl/7.68.0' },
        payload: { role: 'admin; cat /etc/passwd' },
        is_threat: true,
        threat_category: 'Command Injection',
        confidence_score: 0.95,
        risk_level: 'CRITICAL',
        technicalExplanation: 'Command chaining via shell metacharacters attempting system file disclosure.',
        suggestedMitigation: 'Sanitize shell arguments and strictly disallow command execution on user parameters.',
        processed_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: crypto.randomUUID(),
        ip_address: '192.0.2.77',
        method: 'GET',
        endpoint: '/api/v1/dashboard/metrics',
        headers: { 'user-agent': 'Mozilla/5.0 Chrome/120.0' },
        payload: {},
        is_threat: false,
        threat_category: 'None',
        confidence_score: 0.02,
        risk_level: 'BENIGN',
        technicalExplanation: 'Standard benign GET request for dashboard telemetry metrics.',
        suggestedMitigation: 'None required.',
        processed_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ];
    localStore.telemetry_logs.push(...sampleLogs);

    // Initial Quarantined IP
    localStore.quarantine_list.push({
      id: crypto.randomUUID(),
      ip_address: '198.51.100.42',
      reason: 'Automated isolation triggered by SQL Injection payload',
      threat_category: 'SQL Injection',
      status: 'ACTIVE',
      quarantined_at: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      released_at: null
    });

    // Initial Vulnerability
    const vulnId = crypto.randomUUID();
    localStore.vulnerabilities.push({
      id: vulnId,
      telemetry_id: sampleLogs[0].id,
      title: 'Unsanitized Dynamic SQL Query in Auth Route',
      owasp_category: 'A03: Injection',
      file_path: 'server/src/routes/auth.routes.js',
      vulnerable_code: `// Vulnerable Authentication Query\nconst query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";\nconst result = await db.query(query);`,
      severity: 'CRITICAL',
      status: 'UNPATCHED',
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
    });

    // Initial Code Patch
    localStore.code_patches.push({
      id: crypto.randomUUID(),
      vulnerability_id: vulnId,
      patched_code: `// Secure Parameterized Query\nconst query = 'SELECT id, email, password_hash, role FROM users WHERE email = $1';\nconst result = await db.query(query, [req.body.email]);`,
      diff_content: `--- server/src/routes/auth.routes.js\n+++ server/src/routes/auth.routes.js\n@@ -12,2 +12,2 @@\n-const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";\n-const result = await db.query(query);\n+const query = 'SELECT id, email, password_hash, role FROM users WHERE email = $1';\n+const result = await db.query(query, [req.body.email]);`,
      verification_status: 'PASSED',
      verification_output: 'Sandbox exploit test passed. Zero SQL injection vulnerabilities detected.',
      applied_at: null,
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    });
  }

  saveLocalStore();
}

export async function initDb() {
  loadLocalStore();
  await seedInitialData();

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 3000
      });
      await pool.query('SELECT NOW()');
      usePg = true;
      console.log('✅ PostgreSQL database connected successfully.');
    } catch (err) {
      console.warn('⚠️ PostgreSQL connection failed, falling back to local JSON store:', err.message);
      usePg = false;
    }
  } else {
    console.log('ℹ️ Running with local JSON database store.');
  }
}

export const db = {
  async query(text, params = []) {
    if (usePg && pool) {
      return pool.query(text, params);
    }
    // Return dummy object for compat
    return { rows: [], rowCount: 0 };
  },

  // USERS
  async findUserByEmail(email) {
    return localStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    return localStore.users.find(u => u.id === id) || null;
  },

  async createUser({ email, password_hash, role = 'ANALYST' }) {
    const user = {
      id: crypto.randomUUID(),
      email,
      password_hash,
      role,
      created_at: new Date().toISOString()
    };
    localStore.users.push(user);
    saveLocalStore();
    return user;
  },

  // TELEMETRY
  async getTelemetryLogs({ limit = 50, offset = 0, riskLevel, threatCategory }) {
    let logs = [...localStore.telemetry_logs];
    if (riskLevel && riskLevel !== 'ALL') {
      logs = logs.filter(l => l.risk_level === riskLevel);
    }
    if (threatCategory && threatCategory !== 'ALL') {
      logs = logs.filter(l => l.threat_category === threatCategory);
    }
    logs.sort((a, b) => new Date(b.processed_at) - new Date(a.processed_at));
    const total = logs.length;
    const paginated = logs.slice(offset, offset + limit);
    return { logs: paginated, total };
  },

  async insertTelemetry(logData) {
    const record = {
      id: crypto.randomUUID(),
      ip_address: logData.ip_address,
      method: logData.method,
      endpoint: logData.endpoint,
      headers: logData.headers || {},
      payload: logData.payload || {},
      is_threat: Boolean(logData.is_threat),
      threat_category: logData.threat_category || 'None',
      confidence_score: Number(logData.confidence_score) || 0.0,
      risk_level: logData.risk_level || 'BENIGN',
      technicalExplanation: logData.technicalExplanation || '',
      suggestedMitigation: logData.suggestedMitigation || '',
      processed_at: new Date().toISOString()
    };
    localStore.telemetry_logs.unshift(record);
    // Keep last 1000 logs
    if (localStore.telemetry_logs.length > 1000) {
      localStore.telemetry_logs = localStore.telemetry_logs.slice(0, 1000);
    }
    saveLocalStore();
    return record;
  },

  async getTelemetryStats() {
    const totalScanned = localStore.telemetry_logs.length;
    const totalThreats = localStore.telemetry_logs.filter(l => l.is_threat).length;
    const activeQuarantine = localStore.quarantine_list.filter(q => q.status === 'ACTIVE').length;
    
    // OWASP Distribution
    const owaspCounts = {};
    localStore.telemetry_logs.forEach(l => {
      if (l.is_threat && l.threat_category && l.threat_category !== 'None') {
        owaspCounts[l.threat_category] = (owaspCounts[l.threat_category] || 0) + 1;
      }
    });

    // Threat Velocity over time (hourly)
    const velocityMap = {};
    localStore.telemetry_logs.forEach(l => {
      const dateStr = new Date(l.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      velocityMap[dateStr] = (velocityMap[dateStr] || 0) + (l.is_threat ? 1 : 0);
    });

    const velocityTimeline = Object.entries(velocityMap).slice(0, 10).map(([time, value]) => ({ time, threats: value }));

    return {
      totalScanned,
      totalThreats,
      activeQuarantine,
      threatVelocity: totalScanned > 0 ? (totalThreats / totalScanned * 100).toFixed(1) : '0.0',
      owaspDistribution: Object.entries(owaspCounts).map(([name, value]) => ({ name, value })),
      velocityTimeline
    };
  },

  // QUARANTINE
  async getQuarantineList() {
    return localStore.quarantine_list.sort((a, b) => new Date(b.quarantined_at) - new Date(a.quarantined_at));
  },

  async isIpQuarantined(ip) {
    return localStore.quarantine_list.some(q => q.ip_address === ip && q.status === 'ACTIVE');
  },

  async addQuarantine({ ip_address, reason, threat_category }) {
    const existing = localStore.quarantine_list.find(q => q.ip_address === ip_address);
    if (existing) {
      existing.status = 'ACTIVE';
      existing.reason = reason;
      existing.threat_category = threat_category;
      existing.quarantined_at = new Date().toISOString();
      existing.released_at = null;
      saveLocalStore();
      return existing;
    }
    const record = {
      id: crypto.randomUUID(),
      ip_address,
      reason,
      threat_category,
      status: 'ACTIVE',
      quarantined_at: new Date().toISOString(),
      released_at: null
    };
    localStore.quarantine_list.unshift(record);
    saveLocalStore();
    return record;
  },

  async releaseQuarantine(idOrIp) {
    const item = localStore.quarantine_list.find(q => q.id === idOrIp || q.ip_address === idOrIp);
    if (item) {
      item.status = 'RELEASED';
      item.released_at = new Date().toISOString();
      saveLocalStore();
      return item;
    }
    return null;
  },

  // VULNERABILITIES & REMEDIATION
  async getVulnerabilities() {
    return localStore.vulnerabilities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async findVulnerabilityById(id) {
    return localStore.vulnerabilities.find(v => v.id === id) || null;
  },

  async insertVulnerability(vulnData) {
    const record = {
      id: crypto.randomUUID(),
      telemetry_id: vulnData.telemetry_id || null,
      title: vulnData.title,
      owasp_category: vulnData.owasp_category,
      file_path: vulnData.file_path,
      vulnerable_code: vulnData.vulnerable_code,
      severity: vulnData.severity,
      status: vulnData.status || 'UNPATCHED',
      created_at: new Date().toISOString()
    };
    localStore.vulnerabilities.unshift(record);
    saveLocalStore();
    return record;
  },

  async updateVulnerabilityStatus(id, status) {
    const vuln = localStore.vulnerabilities.find(v => v.id === id);
    if (vuln) {
      vuln.status = status;
      saveLocalStore();
    }
    return vuln;
  },

  // CODE PATCHES
  async getPatches() {
    return localStore.code_patches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async findPatchByVulnerabilityId(vulnerabilityId) {
    return localStore.code_patches.find(p => p.vulnerability_id === vulnerabilityId) || null;
  },

  async insertCodePatch(patchData) {
    const existing = localStore.code_patches.find(p => p.vulnerability_id === patchData.vulnerability_id);
    if (existing) {
      existing.patched_code = patchData.patched_code;
      existing.diff_content = patchData.diff_content;
      existing.verification_status = patchData.verification_status || 'UNVERIFIED';
      existing.verification_output = patchData.verification_output || '';
      saveLocalStore();
      return existing;
    }
    const record = {
      id: crypto.randomUUID(),
      vulnerability_id: patchData.vulnerability_id,
      patched_code: patchData.patched_code,
      diff_content: patchData.diff_content,
      verification_status: patchData.verification_status || 'UNVERIFIED',
      verification_output: patchData.verification_output || '',
      applied_at: null,
      created_at: new Date().toISOString()
    };
    localStore.code_patches.unshift(record);
    saveLocalStore();
    return record;
  },

  async updatePatchVerification(id, { verification_status, verification_output }) {
    const patch = localStore.code_patches.find(p => p.id === id || p.vulnerability_id === id);
    if (patch) {
      patch.verification_status = verification_status;
      patch.verification_output = verification_output;
      saveLocalStore();
    }
    return patch;
  },

  async applyPatch(patchId) {
    const patch = localStore.code_patches.find(p => p.id === patchId);
    if (patch) {
      patch.applied_at = new Date().toISOString();
      patch.verification_status = 'PASSED';
      await this.updateVulnerabilityStatus(patch.vulnerability_id, 'RESOLVED');
      saveLocalStore();
    }
    return patch;
  },

  // SETTINGS
  async getSettings() {
    return localStore.settings;
  },

  async updateSettings(newSettings) {
    localStore.settings = { ...localStore.settings, ...newSettings };
    saveLocalStore();
    return localStore.settings;
  }
};
