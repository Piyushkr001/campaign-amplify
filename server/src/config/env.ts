import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const DEV_FALLBACK_JWT_SECRET = 'campaign-amplify-dev-secret-super-secure-key-2026-phase-auth';

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: z.string().default('http://localhost:8081'),
    DATABASE_URL: z.string().optional(),
    JWT_SECRET: z.string().optional(),
    JWT_EXPIRES_IN: z.string().default('8h'),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().default('gemini-1.5-flash'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'In production, JWT_SECRET must be explicitly provided.',
        });
      } else if (data.JWT_SECRET === DEV_FALLBACK_JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'In production, JWT_SECRET must not use the known development fallback secret.',
        });
      } else if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'In production, JWT_SECRET must be at least 32 characters long.',
        });
      }
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid server environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  JWT_SECRET: parsedEnv.data.JWT_SECRET || DEV_FALLBACK_JWT_SECRET,
};

