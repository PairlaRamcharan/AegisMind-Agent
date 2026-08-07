import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { generateToken, authenticateToken } from '../middleware/authMiddleware.js';
import { LoginSchema, RegisterSchema } from '../validators/security.validator.js';

const router = express.Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const user = await db.findUserByEmail(validated.email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const isValidPassword = await bcrypt.compare(validated.password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const token = generateToken(user);
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'Server authentication error: ' + err.message });
  }
});

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const validated = RegisterSchema.parse(req.body);
    const existing = await db.findUserByEmail(validated.email);

    if (existing) {
      return res.status(409).json({ error: 'User account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(validated.password, 10);
    const user = await db.createUser({
      email: validated.email,
      password_hash,
      role: validated.role
    });

    const token = generateToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.errors[0]?.message || 'Validation error' });
    }
    return res.status(500).json({ error: 'User registration failed: ' + err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  return res.status(200).json({ user: req.user });
});

export default router;
