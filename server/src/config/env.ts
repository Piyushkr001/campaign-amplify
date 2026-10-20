import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:8081'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('campaign-amplify-dev-secret-super-secure-key-2026-phase-auth'),
  JWT_EXPIRES_IN: z.string().default('8h'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid server environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
