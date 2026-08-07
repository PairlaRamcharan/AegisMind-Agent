import { z } from 'zod';

export const IngestTelemetrySchema = z.object({
  ip_address: z.string().min(1, { message: "Invalid IPv4 or IPv6 address format" }),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
  endpoint: z.string().min(1).max(2000),
  headers: z.record(z.string()).default({}),
  payload: z.record(z.unknown()).default({})
});

export const IsolateIpSchema = z.object({
  ip_address: z.string().min(1, { message: "Invalid IP address format" }),
  reason: z.string().min(3).max(255),
  threat_category: z.string().min(2).max(100)
});

export const GeneratePatchSchema = z.object({
  vulnerabilityId: z.string().uuid({ message: "Invalid vulnerability UUID format" })
});

export const VerifyPatchSchema = z.object({
  vulnerabilityId: z.string().uuid({ message: "Invalid vulnerability UUID format" }),
  patchedCode: z.string().optional()
});

export const ApplyPatchSchema = z.object({
  patchId: z.string().uuid({ message: "Invalid patch UUID format" })
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(['ADMIN', 'ANALYST']).default('ANALYST')
});

export const SettingsSchema = z.object({
  sensitivityThreshold: z.number().min(0.0).max(1.0),
  autopilotMode: z.boolean(),
  honeypotStrategy: z.enum(['TARPIT', 'FAKE_DATA', 'MIRROR']),
  geminiApiKey: z.string().optional()
});
