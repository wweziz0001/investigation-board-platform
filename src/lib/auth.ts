import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';
import { User, UserRole } from '@prisma/client';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'investigation-board-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const TOKEN_COOKIE_NAME = 'auth_token';

// Types
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT utilities
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Session management (cookie-based)
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

// User authentication helpers
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  // Find user by email
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Account is deactivated' };
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Update last login time
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  // Set cookie
  await setAuthCookie(token);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}): Promise<AuthResult> {
  // Check if email already exists
  const existingEmail = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    return { success: false, error: 'Email already registered' };
  }

  // Check if username already exists
  const existingUsername = await db.user.findUnique({
    where: { username: data.username },
  });

  if (existingUsername) {
    return { success: false, error: 'Username already taken' };
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = await db.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      role: data.role || 'INVESTIGATOR',
    },
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  // Set cookie
  await setAuthCookie(token);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function logoutUser(): Promise<void> {
  await clearAuthCookie();
}

// Role-based access control helpers
export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, ['ADMIN']);
}

export function isInvestigator(user: AuthUser | null): boolean {
  return hasRole(user, ['ADMIN', 'INVESTIGATOR']);
}

export function canView(user: AuthUser | null): boolean {
  return hasRole(user, ['ADMIN', 'INVESTIGATOR', 'VIEWER']);
}

// Utility to check if user can manage other users
export function canManageUsers(currentUser: AuthUser | null, targetUserRole?: UserRole): boolean {
  if (!currentUser) return false;
  
  // Only admins can manage users
  if (currentUser.role !== 'ADMIN') return false;
  
  // Admin cannot be managed by others (only self-updates for non-role fields)
  if (targetUserRole === 'ADMIN' && currentUser.role !== 'ADMIN') return false;
  
  return true;
}
