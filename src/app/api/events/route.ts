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
import { EventType, EventStatus } from '@prisma/client';

// GET /api/events - List events (filter by projectId)
export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { page, limit, search, sortBy, sortOrder, projectId, status, type } =
    parseQueryParams(request);

  // Project ID is required for listing events
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
      status?: EventStatus;
      eventType?: EventType;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        location?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      projectId,
    };

    // Filter by status
    if (status && Object.values(EventStatus).includes(status as EventStatus)) {
      where.status = status as EventStatus;
    }

    // Filter by type
    if (type && Object.values(EventType).includes(type as EventType)) {
      where.eventType = type as EventType;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.event.count({ where });

    // Get events
    const events = await db.event.findMany({
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
        cluster: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        _count: {
          select: {
            evidence: true,
            notes: true,
            sourceRelations: true,
            targetRelations: true,
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

    return apiSuccess(events, 200, meta);
  } catch (error) {
    console.error('Error fetching events:', error);
    return apiError('Failed to fetch events', 500);
  }
}

// POST /api/events - Create event
export async function POST(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  // Only ADMIN and INVESTIGATOR can create events
  if (authResult.user.role === 'VIEWER') {
    return apiForbidden('Viewers cannot create events');
  }

  try {
    const body = await request.json();
    const {
      projectId,
      title,
      description,
      eventDate,
      eventTime,
      location,
      locationCoords,
      eventType = 'GENERAL',
      status = 'NEW',
      confidence = 50,
      importance = 50,
      verified = false,
      positionX = 0,
      positionY = 0,
      width = 280,
      height = 200,
      zIndex = 0,
      isExpanded = true,
      isLocked = false,
      color,
      externalId,
      source,
      reliability = 50,
      clusterId,
    } = body;

    // Validate required fields
    if (!projectId) {
      return apiError('Project ID is required');
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return apiError('Event title is required');
    }

    // Validate enums
    if (eventType && !Object.values(EventType).includes(eventType)) {
      return apiError('Invalid event type');
    }

    if (status && !Object.values(EventStatus).includes(status)) {
      return apiError('Invalid event status');
    }

    // Validate numeric ranges
    if (confidence < 0 || confidence > 100) {
      return apiError('Confidence must be between 0 and 100');
    }

    if (importance < 0 || importance > 100) {
      return apiError('Importance must be between 0 and 100');
    }

    if (reliability < 0 || reliability > 100) {
      return apiError('Reliability must be between 0 and 100');
    }

    // Check project access - need at least MEMBER role to create events
    const accessResult = await hasProjectAccess(authResult.user.id, projectId, 'MEMBER');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // If clusterId is provided, verify it belongs to the project
    if (clusterId) {
      const cluster = await db.cluster.findFirst({
        where: { id: clusterId, projectId },
      });
      if (!cluster) {
        return apiError('Cluster not found in this project');
      }
    }

    // Create event
    const event = await db.event.create({
      data: {
        projectId,
        title: title.trim(),
        description: description?.trim() || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventTime: eventTime || null,
        location: location?.trim() || null,
        locationCoords: locationCoords || null,
        eventType: eventType as EventType,
        status: status as EventStatus,
        confidence,
        importance,
        verified,
        positionX,
        positionY,
        width,
        height,
        zIndex,
        isExpanded,
        isLocked,
        color: color || null,
        externalId: externalId || null,
        source: source?.trim() || null,
        reliability,
        clusterId: clusterId || null,
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
        cluster: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return apiCreated(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return apiError('Failed to create event', 500);
  }
}
