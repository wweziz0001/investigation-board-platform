import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, hasProjectAccess } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiCreated,
  parseQueryParams,
} from '@/lib/api-utils';

// GET /api/comments - List comments (filter by projectId, eventId, relationshipId)
export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { projectId, eventId, relationshipId } = parseQueryParams(request);

  // Project ID is required for listing comments
  if (!projectId) {
    return apiError('Project ID is required');
  }

  try {
    // Check project access
    const accessResult = await hasProjectAccess(authResult.user.id, projectId);
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Build where clause
    const where: {
      projectId: string;
      eventId?: string;
      relationshipId?: string;
      parentId?: string | null;
    } = {
      projectId,
    };

    // Filter by event
    if (eventId) {
      where.eventId = eventId;
    }

    // Filter by relationship
    if (relationshipId) {
      where.relationshipId = relationshipId;
    }

    // Get root comments (no parent) with replies
    where.parentId = null;

    // Get comments with replies
    const comments = await db.comment.findMany({
      where,
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
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return apiError('Failed to fetch comments', 500);
  }
}

// POST /api/comments - Create comment
export async function POST(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  // VIEWER cannot create comments
  if (authResult.user.role === 'VIEWER') {
    return apiForbidden('Viewers cannot create comments');
  }

  try {
    const body = await request.json();
    const {
      projectId,
      eventId,
      relationshipId,
      content,
      parentId,
      position,
    } = body;

    // Validate required fields
    if (!projectId) {
      return apiError('Project ID is required');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return apiError('Comment content is required');
    }

    // Check project access - need at least MEMBER role to create comments
    const accessResult = await hasProjectAccess(authResult.user.id, projectId, 'MEMBER');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Validate eventId if provided
    if (eventId) {
      const event = await db.event.findFirst({
        where: { id: eventId, projectId },
      });
      if (!event) {
        return apiError('Event not found in this project');
      }
    }

    // Validate relationshipId if provided
    if (relationshipId) {
      const relationship = await db.relationship.findFirst({
        where: { id: relationshipId, projectId },
      });
      if (!relationship) {
        return apiError('Relationship not found in this project');
      }
    }

    // Validate parentId if provided
    if (parentId) {
      const parentComment = await db.comment.findFirst({
        where: { id: parentId, projectId },
      });
      if (!parentComment) {
        return apiError('Parent comment not found');
      }
    }

    // Create comment
    const comment = await db.comment.create({
      data: {
        projectId,
        eventId: eventId || null,
        relationshipId: relationshipId || null,
        userId: authResult.user.id,
        content: content.trim(),
        parentId: parentId || null,
        position: position || null,
      },
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

    return apiCreated(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return apiError('Failed to create comment', 500);
  }
}
