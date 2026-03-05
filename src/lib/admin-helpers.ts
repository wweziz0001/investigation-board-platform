import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin role check - for demo purposes, we'll use a simple header-based auth
// In production, this should use proper session/auth from NextAuth
export async function checkAdminAuth(request: NextRequest): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  try {
    // Check for admin auth header (for demo/development)
    const authHeader = request.headers.get('x-admin-auth');
    const userId = request.headers.get('x-user-id');
    
    // If admin header is set to 'true', allow access
    if (authHeader === 'true') {
      return { authorized: true, userId: userId || undefined };
    }
    
    // Otherwise check if user exists and has admin role
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true, isActive: true },
      });
      
      if (user && user.isActive && user.role === 'ADMIN') {
        return { authorized: true, userId };
      }
    }
    
    // Default: check for any admin user in the system for demo
    const adminUser = await db.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    
    if (adminUser) {
      return { authorized: true, userId: adminUser.id };
    }
    
    return { authorized: false, error: 'Admin access required' };
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return { authorized: false, error: 'Authentication error' };
  }
}

// Create audit log entry
export async function createAuditLog(params: {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        status: params.status || 'success',
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Get client IP from request
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

// Get user agent from request
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown';
}

// SQL Query validation
const DANGEROUS_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE',
  'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'XP_', 'SP_', 'SHUTDOWN',
  'PRAGMA', '--', '/*', '*/', ';--'
];

export function validateSqlQuery(sql: string, isAdmin: boolean): { valid: boolean; error?: string } {
  const upperSql = sql.toUpperCase().trim();
  
  // Check for dangerous keywords
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (upperSql.includes(keyword)) {
      // Only admins can run potentially dangerous queries
      if (!isAdmin) {
        return { valid: false, error: `Query contains restricted keyword: ${keyword}` };
      }
    }
  }
  
  // Non-admins can only run SELECT queries
  if (!isAdmin && !upperSql.startsWith('SELECT')) {
    return { valid: false, error: 'Non-admin users can only execute SELECT queries' };
  }
  
  // Check for SQL injection patterns
  const injectionPatterns = [
    /(\bOR\b|\bAND\b)\s*['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
    /UNION\s+(ALL\s+)?SELECT/i,
    /'\s*(OR|AND)\s*'/i,
    /"\s*(OR|AND)\s*"/i,
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(sql)) {
      return { valid: false, error: 'Potential SQL injection detected' };
    }
  }
  
  return { valid: true };
}

// Format table size
export function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Admin error response helper
export function adminErrorResponse(message: string, status: number = 403): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
