import { eq } from 'drizzle-orm';
import { getDb, schema } from '../db/index';
import { env } from '../config/env';

import bcrypt from 'bcryptjs';

export const DEMO_CREATOR_EMAIL = 'creator@campaignamplify.org';
export const DEMO_REVIEWER_EMAIL = 'reviewer@campaignamplify.org';
export const DEMO_BACKER_EMAIL = 'backer@campaignamplify.org';
export const DEMO_ADMIN_EMAIL = 'admin@campaignamplify.org';

export const DEMO_DEFAULT_PASSWORD = 'Password123!';
export const DEMO_ADMIN_PASSWORD = 'AdminPassword123!';

let cachedCreatorId: string | null = null;
let cachedReviewerId: string | null = null;
let cachedBackerId: string | null = null;
let cachedAdminId: string | null = null;

const DEFAULT_HASH = bcrypt.hashSync(DEMO_DEFAULT_PASSWORD, 10);
const ADMIN_HASH = bcrypt.hashSync(DEMO_ADMIN_PASSWORD, 10);

/**
 * Resolves or lazily provisions the demo creator user in Neon.
 */
export async function resolveDemoCreatorId(): Promise<string> {
  if (cachedCreatorId) return cachedCreatorId;
  if (!env.DATABASE_URL) {
    return '00000000-0000-0000-0000-000000000001';
  }

  const db = getDb();
  const existing = await db
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_CREATOR_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    cachedCreatorId = existing[0].id;
    if (!existing[0].passwordHash) {
      await db
        .update(schema.users)
        .set({ passwordHash: DEFAULT_HASH, updatedAt: new Date() })
        .where(eq(schema.users.id, cachedCreatorId as any));
    }
    return cachedCreatorId;
  }

  const [newUser] = await db
    .insert(schema.users)
    .values({
      email: DEMO_CREATOR_EMAIL,
      displayName: 'Clean Water Action Network',
      role: 'USER',
      passwordHash: DEFAULT_HASH,
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
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_REVIEWER_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    cachedReviewerId = existing[0].id;
    if (!existing[0].passwordHash) {
      await db
        .update(schema.users)
        .set({ passwordHash: DEFAULT_HASH, updatedAt: new Date() })
        .where(eq(schema.users.id, cachedReviewerId as any));
    }
    return cachedReviewerId;
  }

  const [newUser] = await db
    .insert(schema.users)
    .values({
      email: DEMO_REVIEWER_EMAIL,
      displayName: 'Editorial Review Board',
      role: 'REVIEWER',
      passwordHash: DEFAULT_HASH,
    })
    .returning({ id: schema.users.id });

  cachedReviewerId = newUser.id;
  return cachedReviewerId;
}

/**
 * Resolves or lazily provisions the demo backer user in Neon.
 */
export async function resolveDemoBackerId(): Promise<string> {
  if (cachedBackerId) return cachedBackerId;
  if (!env.DATABASE_URL) {
    return '00000000-0000-0000-0000-000000000003';
  }

  const db = getDb();
  const existing = await db
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_BACKER_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    cachedBackerId = existing[0].id;
    if (!existing[0].passwordHash) {
      await db
        .update(schema.users)
        .set({ passwordHash: DEFAULT_HASH, updatedAt: new Date() })
        .where(eq(schema.users.id, cachedBackerId as any));
    }
    return cachedBackerId;
  }

  const [newUser] = await db
    .insert(schema.users)
    .values({
      email: DEMO_BACKER_EMAIL,
      displayName: 'Community Backer',
      role: 'USER',
      passwordHash: DEFAULT_HASH,
    })
    .returning({ id: schema.users.id });

  cachedBackerId = newUser.id;
  return cachedBackerId;
}

/**
 * Resolves or lazily provisions the demo admin user in Neon.
 */
export async function resolveDemoAdminId(): Promise<string> {
  if (cachedAdminId) return cachedAdminId;
  if (!env.DATABASE_URL) {
    return '00000000-0000-0000-0000-000000000004';
  }

  const db = getDb();
  const existing = await db
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, DEMO_ADMIN_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    cachedAdminId = existing[0].id;
    if (!existing[0].passwordHash) {
      await db
        .update(schema.users)
        .set({ passwordHash: ADMIN_HASH, updatedAt: new Date() })
        .where(eq(schema.users.id, cachedAdminId as any));
    }
    return cachedAdminId;
  }

  const [newUser] = await db
    .insert(schema.users)
    .values({
      email: DEMO_ADMIN_EMAIL,
      displayName: 'Platform Administrator',
      role: 'ADMIN',
      passwordHash: ADMIN_HASH,
    })
    .returning({ id: schema.users.id });

  cachedAdminId = newUser.id;
  return cachedAdminId;
}

