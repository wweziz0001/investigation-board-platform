import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, hasProjectAccess, ROLE_HIERARCHY } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden,
} from '@/lib/api-utils';
import { ProjectStatus, ProjectPriority, MemberRole } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get project details with members
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

    const project = await db.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
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
        },
        tags: true,
        _count: {
          select: {
            events: true,
            relationships: true,
            evidence: true,
            notes: true,
          },
        },
      },
    });

    if (!project) {
      return apiNotFound('Project not found');
    }

    return apiSuccess(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return apiError('Failed to fetch project', 500);
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Check project access - need at least MEMBER role to update
    const accessResult = await hasProjectAccess(id, authResult.user.id, 'MEMBER');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      boardViewport,
      boardSettings,
      isArchived,
    } = body;

    // Build update data
    const updateData: {
      name?: string;
      description?: string | null;
      status?: ProjectStatus;
      priority?: ProjectPriority;
      startDate?: Date | null;
      endDate?: Date | null;
      boardViewport?: string | null;
      boardSettings?: string | null;
      isArchived?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return apiError('Project name cannot be empty');
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (status !== undefined) {
      if (!Object.values(ProjectStatus).includes(status)) {
        return apiError('Invalid project status');
      }
      updateData.status = status;
    }

    if (priority !== undefined) {
      if (!Object.values(ProjectPriority).includes(priority)) {
        return apiError('Invalid project priority');
      }
      updateData.priority = priority;
    }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }

    if (boardViewport !== undefined) {
      updateData.boardViewport = boardViewport;
    }

    if (boardSettings !== undefined) {
      updateData.boardSettings = boardSettings;
    }

    // Only OWNER/ADMIN can archive/unarchive
    if (isArchived !== undefined) {
      const memberRole = accessResult.memberRole as MemberRole;
      const userRoleLevel = ROLE_HIERARCHY[memberRole] || 0;
      if (userRoleLevel < ROLE_HIERARCHY.ADMIN) {
        return apiForbidden('Only admins can archive/unarchive projects');
      }
      updateData.isArchived = isArchived;
    }

    const project = await db.project.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return apiSuccess(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return apiError('Failed to update project', 500);
  }
}

// DELETE /api/projects/[id] - Delete project (owner/admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Check project access - need OWNER role to delete
    const accessResult = await hasProjectAccess(id, authResult.user.id, 'OWNER');
    
    // System admins can also delete
    if (!accessResult.hasAccess && authResult.user.role !== 'ADMIN') {
      return apiForbidden('Only project owners or system admins can delete projects');
    }

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!project) {
      return apiNotFound('Project not found');
    }

    // Delete project (cascade will handle related records)
    await db.project.delete({
      where: { id },
    });

    return apiSuccess({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return apiError('Failed to delete project', 500);
  }
}
