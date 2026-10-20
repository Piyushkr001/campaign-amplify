import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db/index';
import { env } from '../config/env';

export const DEMO_CREATOR_EMAIL = 'creator@campaignamplify.org';
export const DEMO_REVIEWER_EMAIL = 'reviewer@campaignamplify.org';

let cachedCreatorId: string | null = null;
let cachedReviewerId: string | null = null;

/**
 * Resolves or lazily provisions the demo creator user in Neon.
 * Ready to be replaced by JWT request context in future phases.
 */
export async function resolveDemoCreatorId(): Promise<string> {
  if (cachedCreatorId) return cachedCreatorId;
  if (!env.DATABASE_URL) {
    return '00000000-0000-0000-0000-000000000001';
  }

  const db = getDb();
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_CREATOR_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    cachedCreatorId = existing[0].id;
    return cachedCreatorId;
  }

  const [newUser] = await db
    .insert(schema.users)
    .values({
      email: DEMO_CREATOR_EMAIL,
      displayName: 'Clean Water Action Network',
      role: 'USER',
    })
    .returning({ id: schema.users.id });

  cachedCreatorId = newUser.id;
  return cachedCreatorId;
}

/**
 * Resolves or lazily provisions the demo reviewer user in Neon.
 * Ready to be replaced by JWT request context in future phases.
 */
export async function resolveDemoReviewerId(): Promise<string> {
  if (cachedReviewerId) return cachedReviewerId;
  if (!env.DATABASE_URL) {
    return '00000000-0000-0000-0000-000000000002';
  }

  const db = getDb();
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_REVIEWER_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    cachedReviewerId = existing[0].id;
    return cachedReviewerId;
  }

  const [newUser] = await db
    .insert(schema.users)
    .values({
      email: DEMO_REVIEWER_EMAIL,
      displayName: 'Editorial Review Board',
      role: 'REVIEWER',
    })
    .returning({ id: schema.users.id });

  cachedReviewerId = newUser.id;
  return cachedReviewerId;
}
