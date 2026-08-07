import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { SettingsSchema } from '../validators/security.validator.js';

const router = express.Router();

// GET /api/v1/settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await db.getSettings();
    // Mask API Key for client response security
    const maskedKey = settings?.geminiApiKey ? `${settings.geminiApiKey.substring(0, 4)}...${settings.geminiApiKey.substring(settings.geminiApiKey.length - 4)}` : '';
    
    return res.status(200).json({
      ...settings,
      geminiApiKeyMasked: maskedKey
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch platform settings: ' + err.message });
  }
});

// POST /api/v1/settings
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validated = SettingsSchema.parse(req.body);
    const updated = await db.updateSettings(validated);

    return res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully.',
      settings: updated
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'Failed to update platform settings: ' + err.message });
  }
});

export default router;
