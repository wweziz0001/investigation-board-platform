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
import { MemberRole } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/comments/[id] - Get comment details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    const comment = await db.comment.findUnique({
      where: { id },
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
        replies: {
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
          orderBy: { createdAt: 'asc' },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        relationship: {
          select: {
            id: true,
            label: true,
            relationType: true,
          },
        },
      },
    });

    if (!comment) {
      return apiNotFound('Comment not found');
    }

    // Check project access
    const accessResult = await hasProjectAccess(comment.projectId, authResult.user.id);
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    return apiSuccess(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    return apiError('Failed to fetch comment', 500);
  }
}

// PUT /api/comments/[id] - Update comment
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing comment
    const existingComment = await db.comment.findUnique({
      where: { id },
      select: { id: true, projectId: true, userId: true, content: true },
    });

    if (!existingComment) {
      return apiNotFound('Comment not found');
    }

    // Check project access
    const accessResult = await hasProjectAccess(
      existingComment.projectId,
      authResult.user.id,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Check if user is the author or has admin role
    const isAuthor = existingComment.userId === authResult.user.id;
    const memberRole = accessResult.memberRole as MemberRole;
    const userRoleLevel = ROLE_HIERARCHY[memberRole] || 0;
    const isAdmin = userRoleLevel >= ROLE_HIERARCHY.ADMIN;

    if (!isAuthor && !isAdmin) {
      return apiForbidden('You can only edit your own comments');
    }

    const body = await request.json();
    const { content, position } = body;

    // Build update data
    const updateData: {
      content?: string;
      position?: string | null;
    } = {};

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return apiError('Comment content cannot be empty');
      }
      updateData.content = content.trim();
    }

    if (position !== undefined) {
      updateData.position = position || null;
    }

    // Update comment
    const comment = await db.comment.update({
      where: { id },
      data: updateData,
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
        replies: true,
      },
    });

    return apiSuccess(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return apiError('Failed to update comment', 500);
  }
}

// DELETE /api/comments/[id] - Delete comment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing comment
    const existingComment = await db.comment.findUnique({
      where: { id },
      select: { id: true, projectId: true, userId: true, content: true },
    });

    if (!existingComment) {
      return apiNotFound('Comment not found');
    }

    // Check project access
    const accessResult = await hasProjectAccess(
      existingComment.projectId,
      authResult.user.id,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Check if user is the author or has admin role
    const isAuthor = existingComment.userId === authResult.user.id;
    const memberRole = accessResult.memberRole as MemberRole;
    const userRoleLevel = ROLE_HIERARCHY[memberRole] || 0;
    const isAdmin = userRoleLevel >= ROLE_HIERARCHY.ADMIN;

    if (!isAuthor && !isAdmin) {
      return apiForbidden('You can only delete your own comments');
    }

    // Delete comment (cascade will handle replies)
    await db.comment.delete({
      where: { id },
    });

    return apiSuccess({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return apiError('Failed to delete comment', 500);
  }
}
