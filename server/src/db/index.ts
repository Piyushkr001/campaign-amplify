import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema/index';
import { env } from '../config/env';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined in server environment.');
    }
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export { schema };
