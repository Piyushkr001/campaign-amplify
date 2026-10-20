import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/index';
import { env } from '../../config/env';
import { UserRole, AuthUserDTO } from './auth.types';
import { DatabaseUnavailableError } from '../../utils/errors';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export const AuthRepository = {
  findByEmail: async (email: string): Promise<UserEntity | null> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.trim().toLowerCase()))
      .limit(1);

    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      passwordHash: u.passwordHash,
      displayName: u.displayName,
      role: u.role as UserRole,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  },

  findById: async (id: string): Promise<UserEntity | null> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id as any))
      .limit(1);

    if (rows.length === 0) return null;
    const u = rows[0];
    return {
      id: u.id,
      email: u.email,
      passwordHash: u.passwordHash,
      displayName: u.displayName,
      role: u.role as UserRole,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  },

  createUser: async (data: {
    email: string;
    passwordHash: string;
    displayName: string;
    role?: UserRole;
  }): Promise<AuthUserDTO> => {
    if (!env.DATABASE_URL) {
      throw new DatabaseUnavailableError('Database is not configured.');
    }

    const db = getDb();
    const now = new Date();
    const [inserted] = await db
      .insert(schema.users)
      .values({
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        displayName: data.displayName.trim(),
        role: data.role || 'USER',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return {
      id: inserted.id,
      email: inserted.email,
      displayName: inserted.displayName,
      role: inserted.role as UserRole,
      createdAt: inserted.createdAt.toISOString(),
    };
  },
};
