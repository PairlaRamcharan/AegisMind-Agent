import express from 'express';
import { db } from '../config/db.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { generateCodePatch } from '../services/patchGenerator.js';
import { verifyPatchInSandbox } from '../services/sandboxRunner.js';
import { GeneratePatchSchema, VerifyPatchSchema, ApplyPatchSchema } from '../validators/security.validator.js';

const router = express.Router();

// GET /api/v1/remediation/vulnerabilities
router.get('/vulnerabilities', authenticateToken, async (req, res) => {
  try {
    const vulnerabilities = await db.getVulnerabilities();
    const patches = await db.getPatches();

    // Map patches to vulnerabilities
    const enriched = vulnerabilities.map(v => {
      const patch = patches.find(p => p.vulnerability_id === v.id);
      return {
        ...v,
        patch: patch || null
      };
    });

    return res.status(200).json({ vulnerabilities: enriched });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve vulnerabilities: ' + err.message });
  }
});

// POST /api/v1/remediation/generate-patch
router.post('/generate-patch', authenticateToken, async (req, res) => {
  try {
    const validated = GeneratePatchSchema.parse(req.body);
    const patchData = await generateCodePatch(validated.vulnerabilityId);
    
    const patch = await db.insertCodePatch(patchData);
    await db.updateVulnerabilityStatus(validated.vulnerabilityId, 'PATCH_PENDING');

    return res.status(200).json({
      success: true,
      patch
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'Patch generation failed: ' + err.message });
  }
});

// POST /api/v1/remediation/verify-patch
router.post('/verify-patch', authenticateToken, async (req, res) => {
  try {
    const validated = VerifyPatchSchema.parse(req.body);
    const result = await verifyPatchInSandbox(validated.vulnerabilityId, validated.patchedCode);

    const patch = await db.findPatchByVulnerabilityId(validated.vulnerabilityId);
    if (result.status === 'PASSED') {
      await db.updateVulnerabilityStatus(validated.vulnerabilityId, 'VERIFIED');
    }

    return res.status(200).json({
      success: true,
      result,
      patch
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'Patch verification failed: ' + err.message });
  }
});

// POST /api/v1/remediation/apply-patch
router.post('/apply-patch', authenticateToken, async (req, res) => {
  try {
    const validated = ApplyPatchSchema.parse(req.body);
    const patch = await db.applyPatch(validated.patchId);

    if (!patch) {
      return res.status(404).json({ error: 'Code patch record not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verified patch successfully applied to target source file.',
      patch
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'Failed to apply code patch: ' + err.message });
  }
});

export default router;
