import { db } from '../config/db.js';

export async function handleHoneypotRedirect(req, res, ip, reason) {
  const settings = await db.getSettings();
  const strategy = settings?.honeypotStrategy || 'FAKE_DATA';

  console.log(`🍯 [HONEYPOT ENGAGED] Intercepted Quarantined IP: ${ip} | Strategy: ${strategy}`);

  if (strategy === 'TARPIT') {
    // Artificial delay to consume attacker resources
    const delay = Math.floor(Math.random() * 3000) + 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return res.status(200).json({
      status: 'success',
      timestamp: new Date().toISOString(),
      latency: `${delay}ms`,
      message: 'Processing server request...',
      results: []
    });
  }

  if (strategy === 'MIRROR') {
    // Echo payload with modified fake state
    return res.status(200).json({
      status: 'acknowledged',
      echoedPayload: req.body || req.query,
      simulatedState: 'EXECUTION_SANDBOXED',
      sessionHash: '0x8f2a991e',
      notice: 'State committed to virtual buffer'
    });
  }

  // Default: FAKE_DATA (decoy environment responses)
  return res.status(200).json({
    status: 'ok',
    environment: 'production-us-east-1',
    decoyUsers: [
      { id: 'usr_decoy_01', username: 'db_admin_root', role: 'SUPERUSER', token: 'eyDecoyKey_991827361' },
      { id: 'usr_decoy_02', username: 'finance_lead', role: 'ACCOUNTANT', token: 'eyDecoyKey_112233445' }
    ],
    mockCredentials: {
      AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
      AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    },
    quarantineNotice: 'Session isolated in dynamic deception environment'
  });
}
