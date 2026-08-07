import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { IsolateIpSchema } from '../validators/security.validator.js';

const router = express.Router();

// GET /api/v1/quarantine
router.get('/', authenticateToken, async (req, res) => {
  try {
    const list = await db.getQuarantineList();
    const settings = await db.getSettings();
    
    const activeCount = list.filter(q => q.status === 'ACTIVE').length;
    const releasedCount = list.filter(q => q.status === 'RELEASED').length;

    return res.status(200).json({
      quarantineList: list,
      stats: {
        activeCount,
        releasedCount,
        totalCount: list.length,
        currentStrategy: settings?.honeypotStrategy || 'FAKE_DATA'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve quarantine records: ' + err.message });
  }
});

// POST /api/v1/quarantine/isolate
router.post('/isolate', authenticateToken, async (req, res) => {
  try {
    const validated = IsolateIpSchema.parse(req.body);
    const record = await db.addQuarantine({
      ip_address: validated.ip_address,
      reason: validated.reason,
      threat_category: validated.threat_category
    });

    return res.status(201).json({
      success: true,
      message: `IP ${validated.ip_address} quarantined successfully.`,
      record
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'Failed to isolate IP: ' + err.message });
  }
});

// DELETE /api/v1/quarantine/release/:id
router.delete('/release/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const released = await db.releaseQuarantine(id);

    if (!released) {
      return res.status(404).json({ error: 'Quarantine record not found for specified ID or IP.' });
    }

    return res.status(200).json({
      success: true,
      message: `IP ${released.ip_address} released from quarantine.`,
      record: released
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to release IP from quarantine: ' + err.message });
  }
});

export default router;
