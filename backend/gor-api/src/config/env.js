const { z } = require('zod');

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z.coerce.boolean().default(false),
  PAYMENT_MODE: z.enum(['gateway', 'dummy']).default('gateway'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[ENV] Invalid environment variables:', parsed.error.flatten().fieldErrors);
  // In development, allow missing JWT_SECRET as default
  if (process.env.NODE_ENV === 'production') {
    console.error('[ENV] CRITICAL: Environment variables missing in production');
    process.exit(1);
  }
  console.warn('[ENV] Using default values for missing variables');
}

const env = parsed.data || {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost/gor',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  PORT: parseInt(process.env.PORT || '4000'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
  MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'gateway',
};
