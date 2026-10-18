import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3XTwZFAu1sfd@ep-late-term-ayvwv3vm-pooler.c-5.us-east-2.aws.neon.tech/Campaign-Amplify?sslmode=require&channel_binding=require',
  },
  verbose: true,
  strict: true,
});
