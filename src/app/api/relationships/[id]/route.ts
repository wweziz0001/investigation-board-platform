import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, hasProjectAccess } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  apiForbidden,
} from '@/lib/api-utils';
import { RelationType, LineStyle } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/relationships/[id] - Get relationship details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    const relationship = await db.relationship.findUnique({
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
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        sourceEvent: {
          select: {
            id: true,
            title: true,
            eventType: true,
            positionX: true,
            positionY: true,
            status: true,
          },
        },
        targetEvent: {
          select: {
            id: true,
            title: true,
            eventType: true,
            positionX: true,
            positionY: true,
            status: true,
          },
        },
        notes: {
          where: { isPrivate: false },
          select: {
            id: true,
            content: true,
            noteType: true,
            createdAt: true,
            createdBy: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!relationship) {
      return apiNotFound('Relationship not found');
    }

    // Check project access
    const accessResult = await hasProjectAccess(relationship.projectId, authResult.user.id);
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    return apiSuccess(relationship);
  } catch (error) {
    console.error('Error fetching relationship:', error);
    return apiError('Failed to fetch relationship', 500);
  }
}

// PUT /api/relationships/[id] - Update relationship
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing relationship
    const existingRelationship = await db.relationship.findUnique({
      where: { id },
      select: { id: true, projectId: true, sourceEventId: true, targetEventId: true },
    });

    if (!existingRelationship) {
      return apiNotFound('Relationship not found');
    }

    // Check project access - need at least MEMBER role to update relationships
    const accessResult = await hasProjectAccess(
      existingRelationship.projectId,
      authResult.user.id,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const body = await request.json();
    const {
      sourceEventId,
      targetEventId,
      relationType,
      label,
      description,
      strength,
      confidence,
      color,
      lineStyle,
      lineWidth,
      isAnimated,
      isCurved,
      evidence,
      source,
    } = body;

    // Validate new source/target events if provided
    let newSourceEventId = existingRelationship.sourceEventId;
    let newTargetEventId = existingRelationship.targetEventId;

    if (sourceEventId !== undefined || targetEventId !== undefined) {
      if (sourceEventId !== undefined) {
        const sourceEvent = await db.event.findFirst({
          where: { id: sourceEventId, projectId: existingRelationship.projectId },
        });
        if (!sourceEvent) {
          return apiError('Source event not found in this project');
        }
        newSourceEventId = sourceEventId;
      }

      if (targetEventId !== undefined) {
        const targetEvent = await db.event.findFirst({
          where: { id: targetEventId, projectId: existingRelationship.projectId },
        });
        if (!targetEvent) {
          return apiError('Target event not found in this project');
        }
        newTargetEventId = targetEventId;
      }

      // Check for self-referential
      if (newSourceEventId === newTargetEventId) {
        return apiError('Source and target events cannot be the same');
      }

      // Check for duplicate if changing events
      if (
        newSourceEventId !== existingRelationship.sourceEventId ||
        newTargetEventId !== existingRelationship.targetEventId
      ) {
        const duplicate = await db.relationship.findFirst({
          where: {
            projectId: existingRelationship.projectId,
            sourceEventId: newSourceEventId,
            targetEventId: newTargetEventId,
            id: { not: id },
          },
        });
        if (duplicate) {
          return apiError('Relationship already exists between these events');
        }
      }
    }

    // Build update data
    const updateData: {
      sourceEventId?: string;
      targetEventId?: string;
      relationType?: RelationType;
      label?: string | null;
      description?: string | null;
      strength?: number;
      confidence?: number;
      color?: string | null;
      lineStyle?: LineStyle;
      lineWidth?: number;
      isAnimated?: boolean;
      isCurved?: boolean;
      evidence?: string | null;
      source?: string | null;
    } = {};

    if (sourceEventId !== undefined) {
      updateData.sourceEventId = sourceEventId;
    }

    if (targetEventId !== undefined) {
      updateData.targetEventId = targetEventId;
    }

    if (relationType !== undefined) {
      if (!Object.values(RelationType).includes(relationType)) {
        return apiError('Invalid relationship type');
      }
      updateData.relationType = relationType;
    }

    if (label !== undefined) {
      updateData.label = label?.trim() || null;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (strength !== undefined) {
      if (strength < 0 || strength > 100) {
        return apiError('Strength must be between 0 and 100');
      }
      updateData.strength = strength;
    }

    if (confidence !== undefined) {
      if (confidence < 0 || confidence > 100) {
        return apiError('Confidence must be between 0 and 100');
      }
      updateData.confidence = confidence;
    }

    if (color !== undefined) {
      updateData.color = color || null;
    }

    if (lineStyle !== undefined) {
      if (!Object.values(LineStyle).includes(lineStyle)) {
        return apiError('Invalid line style');
      }
      updateData.lineStyle = lineStyle;
    }

    if (lineWidth !== undefined) {
      updateData.lineWidth = Number(lineWidth);
    }

    if (isAnimated !== undefined) {
      updateData.isAnimated = Boolean(isAnimated);
    }

    if (isCurved !== undefined) {
      updateData.isCurved = Boolean(isCurved);
    }

    if (evidence !== undefined) {
      updateData.evidence = evidence?.trim() || null;
    }

    if (source !== undefined) {
      updateData.source = source?.trim() || null;
    }

    const relationship = await db.relationship.update({
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
        sourceEvent: {
          select: {
            id: true,
            title: true,
            eventType: true,
          },
        },
        targetEvent: {
          select: {
            id: true,
            title: true,
            eventType: true,
          },
        },
      },
    });

    return apiSuccess(relationship);
  } catch (error) {
    console.error('Error updating relationship:', error);
    return apiError('Failed to update relationship', 500);
  }
}

// DELETE /api/relationships/[id] - Delete relationship
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing relationship
    const existingRelationship = await db.relationship.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!existingRelationship) {
      return apiNotFound('Relationship not found');
    }

    // Check project access - need at least MEMBER role to delete relationships
    const accessResult = await hasProjectAccess(
      existingRelationship.projectId,
      authResult.user.id,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Delete relationship (cascade will handle notes)
    await db.relationship.delete({
      where: { id },
    });

    return apiSuccess({ message: 'Relationship deleted successfully' });
  } catch (error) {
    console.error('Error deleting relationship:', error);
    return apiError('Failed to delete relationship', 500);
  }
}
