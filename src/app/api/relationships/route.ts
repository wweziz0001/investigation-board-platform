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
  calculatePagination,
} from '@/lib/api-utils';
import { RelationType, LineStyle } from '@prisma/client';

// GET /api/relationships - List relationships (filter by projectId)
export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { page, limit, sortBy, sortOrder, projectId, type } =
    parseQueryParams(request);

  // Project ID is required for listing relationships
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
      relationType?: RelationType;
    } = {
      projectId,
    };

    // Filter by type
    if (type && Object.values(RelationType).includes(type as RelationType)) {
      where.relationType = type as RelationType;
    }

    // Get total count
    const total = await db.relationship.count({ where });

    // Get relationships
    const relationships = await db.relationship.findMany({
      where,
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
            positionX: true,
            positionY: true,
          },
        },
        targetEvent: {
          select: {
            id: true,
            title: true,
            eventType: true,
            positionX: true,
            positionY: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const meta = calculatePagination(total, page, limit);

    return apiSuccess(relationships, 200, meta);
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return apiError('Failed to fetch relationships', 500);
  }
}

// POST /api/relationships - Create relationship
export async function POST(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  // Only ADMIN and INVESTIGATOR can create relationships
  if (authResult.user.role === 'VIEWER') {
    return apiForbidden('Viewers cannot create relationships');
  }

  try {
    const body = await request.json();
    const {
      projectId,
      sourceEventId,
      targetEventId,
      relationType = 'RELATED',
      label,
      description,
      strength = 50,
      confidence = 50,
      color,
      lineStyle = 'SOLID',
      lineWidth = 2,
      isAnimated = false,
      isCurved = true,
      sourceHandle,
      targetHandle,
      evidence,
      source,
    } = body;

    // Validate required fields
    if (!projectId) {
      return apiError('Project ID is required');
    }

    if (!sourceEventId) {
      return apiError('Source event ID is required');
    }

    if (!targetEventId) {
      return apiError('Target event ID is required');
    }

    // Cannot create self-referential relationship
    if (sourceEventId === targetEventId) {
      return apiError('Source and target events cannot be the same');
    }

    // Validate enums
    if (relationType && !Object.values(RelationType).includes(relationType)) {
      return apiError('Invalid relationship type');
    }

    if (lineStyle && !Object.values(LineStyle).includes(lineStyle)) {
      return apiError('Invalid line style');
    }

    // Validate numeric ranges
    if (strength < 0 || strength > 100) {
      return apiError('Strength must be between 0 and 100');
    }

    if (confidence < 0 || confidence > 100) {
      return apiError('Confidence must be between 0 and 100');
    }

    // Check project access - need at least MEMBER role to create relationships
    const accessResult = await hasProjectAccess(authResult.user.id, projectId, 'MEMBER');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Verify both events exist and belong to the project
    const [sourceEvent, targetEvent] = await Promise.all([
      db.event.findFirst({
        where: { id: sourceEventId, projectId },
        select: { id: true },
      }),
      db.event.findFirst({
        where: { id: targetEventId, projectId },
        select: { id: true },
      }),
    ]);

    if (!sourceEvent) {
      return apiError('Source event not found in this project');
    }

    if (!targetEvent) {
      return apiError('Target event not found in this project');
    }

    // Check if relationship already exists
    const existingRelationship = await db.relationship.findFirst({
      where: {
        projectId,
        sourceEventId,
        targetEventId,
      },
    });

    if (existingRelationship) {
      return apiError('Relationship already exists between these events');
    }

    // Create relationship
    const relationship = await db.relationship.create({
      data: {
        projectId,
        sourceEventId,
        targetEventId,
        relationType: relationType as RelationType,
        label: label?.trim() || null,
        description: description?.trim() || null,
        strength,
        confidence,
        color: color || null,
        lineStyle: lineStyle as LineStyle,
        lineWidth,
        isAnimated,
        isCurved,
        sourceHandle: sourceHandle || null,
        targetHandle: targetHandle || null,
        evidence: evidence?.trim() || null,
        source: source?.trim() || null,
        createdById: authResult.user.id,
      },
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

    return apiCreated(relationship);
  } catch (error) {
    console.error('Error creating relationship:', error);
    return apiError('Failed to create relationship', 500);
  }
}
