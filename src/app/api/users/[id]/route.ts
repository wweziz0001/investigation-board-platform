import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword, isAdmin, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Validation schema for updating a user
const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  avatar: z.string().max(500).nullable().optional(),
  role: z.enum(['ADMIN', 'INVESTIGATOR', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
  currentPassword: z.string().optional(),
});

// Helper function to get user ID from params
function getUserIdFromParams(params: Promise<{ id: string }>): Promise<string> {
  return params.then(p => p.id);
}

// GET: Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromParams(params);

    // Users can view their own profile, admins can view any profile
    if (currentUser.id !== userId && !isAdmin(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
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
        _count: {
          select: {
            projects: true,
            createdEvents: true,
            createdEvidence: true,
            createdNotes: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = await getUserIdFromParams(params);

    // Check if target user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;
    const isSelfUpdate = currentUser.id === userId;
    const isAdminUser = isAdmin(currentUser);

    // Permission checks
    if (!isSelfUpdate && !isAdminUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Non-admin users cannot change role or isActive
    if (!isAdminUser) {
      delete updateData.role;
      delete updateData.isActive;
    }

    // Admin cannot deactivate themselves or change their own role
    if (isSelfUpdate && isAdminUser) {
      if (updateData.isActive === false) {
        return NextResponse.json(
          { success: false, error: 'Cannot deactivate your own account' },
          { status: 400 }
        );
      }
      delete updateData.role; // Admin cannot change their own role
    }

    // Password change requires current password verification (for self-updates)
    if (updateData.password && isSelfUpdate) {
      if (!updateData.currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      const isValidPassword = await verifyPassword(updateData.currentPassword, targetUser.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const data: {
      email?: string;
      username?: string;
      passwordHash?: string;
      firstName?: string | null;
      lastName?: string | null;
      avatar?: string | null;
      role?: UserRole;
      isActive?: boolean;
    } = {};

    if (updateData.email && updateData.email !== targetUser.email) {
      const existingEmail = await db.user.findUnique({
        where: { email: updateData.email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
      data.email = updateData.email;
    }

    if (updateData.username && updateData.username !== targetUser.username) {
      const existingUsername = await db.user.findUnique({
        where: { username: updateData.username },
      });
      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: 'Username already taken' },
          { status: 400 }
        );
      }
      data.username = updateData.username;
    }

    if (updateData.password) {
      data.passwordHash = await hashPassword(updateData.password);
    }

    if ('firstName' in updateData) {
      data.firstName = updateData.firstName;
    }

    if ('lastName' in updateData) {
      data.lastName = updateData.lastName;
    }

    if ('avatar' in updateData) {
      data.avatar = updateData.avatar;
    }

    if (updateData.role) {
      data.role = updateData.role as UserRole;
    }

    if (updateData.isActive !== undefined) {
      data.isActive = updateData.isActive;
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data,
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    const userId = await getUserIdFromParams(params);

    // Cannot delete yourself
    if (currentUser.id === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (cascade will handle related records)
    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
