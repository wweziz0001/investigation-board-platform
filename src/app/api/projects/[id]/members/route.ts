import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, hasProjectAccess, ROLE_HIERARCHY } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden,
  apiCreated,
} from '@/lib/api-utils';
import { MemberRole } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/members - List project members
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Check project access
    const accessResult = await hasProjectAccess(id, authResult.user.id);
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const members = await db.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return apiSuccess(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    return apiError('Failed to fetch project members', 500);
  }
}

// POST /api/projects/[id]/members - Add member to project
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Check project access - need ADMIN role to add members
    const accessResult = await hasProjectAccess(id, authResult.user.id, 'ADMIN');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const body = await request.json();
    const { userId, role = 'MEMBER' } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return apiError('User ID is required');
    }

    // Validate role
    if (role && !Object.values(MemberRole).includes(role)) {
      return apiError('Invalid member role');
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      return apiNotFound('Project not found');
    }

    // Check if user exists and is active
    const userToAdd = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, username: true },
    });

    if (!userToAdd) {
      return apiNotFound('User not found');
    }

    if (!userToAdd.isActive) {
      return apiError('Cannot add inactive user to project');
    }

    // Check if user is already a member
    const existingMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    if (existingMember) {
      return apiError('User is already a member of this project');
    }

    // Check if adding OWNER role - only existing OWNER can add another OWNER
    if (role === MemberRole.OWNER) {
      const memberRole = accessResult.memberRole as MemberRole;
      if (memberRole !== MemberRole.OWNER) {
        return apiForbidden('Only project owners can add new owners');
      }
    }

    // Add member
    const newMember = await db.projectMember.create({
      data: {
        projectId: id,
        userId,
        role: role as MemberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return apiCreated(newMember);
  } catch (error) {
    console.error('Error adding project member:', error);
    return apiError('Failed to add project member', 500);
  }
}
