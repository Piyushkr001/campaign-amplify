import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  try {
    const envPath = path.resolve(__dirname, 'server/.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        databaseUrl = match[1].trim();
      }
    }
  } catch {}
}

export default defineConfig({
  schema: './server/src/db/schema/index.ts',
  out: './server/src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      databaseUrl ||
      'postgresql://postgres:postgres@localhost:5432/campaign_amplify',
  },
  verbose: true,
  strict: true,
});
