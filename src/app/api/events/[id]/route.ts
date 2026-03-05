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
import { EventType, EventStatus, MemberRole } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/events/[id] - Get event details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    const event = await db.event.findUnique({
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
        evidence: {
          select: {
            id: true,
            title: true,
            evidenceType: true,
            fileName: true,
            isVerified: true,
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
        sourceRelations: {
          include: {
            targetEvent: {
              select: {
                id: true,
                title: true,
                eventType: true,
              },
            },
          },
        },
        targetRelations: {
          include: {
            sourceEvent: {
              select: {
                id: true,
                title: true,
                eventType: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return apiNotFound('Event not found');
    }

    // Check project access
    const accessResult = await hasProjectAccess(event.projectId, authResult.user.id);
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    return apiSuccess(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return apiError('Failed to fetch event', 500);
  }
}

// PUT /api/events/[id] - Update event (including position)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing event
    const existingEvent = await db.event.findUnique({
      where: { id },
      select: { id: true, projectId: true, isLocked: true, createdById: true },
    });

    if (!existingEvent) {
      return apiNotFound('Event not found');
    }

    // Check project access - need at least MEMBER role to update events
    const accessResult = await hasProjectAccess(
      existingEvent.projectId,
      authResult.user.id,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const body = await request.json();
    const {
      title,
      description,
      eventDate,
      eventTime,
      location,
      locationCoords,
      eventType,
      status,
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
      color,
      externalId,
      source,
      reliability,
      clusterId,
    } = body;

    // Check if event is locked - only OWNER/ADMIN can unlock
    if (existingEvent.isLocked && isLocked !== true) {
      const memberRole = accessResult.memberRole as MemberRole;
      const userRoleLevel = ROLE_HIERARCHY[memberRole] || 0;
      if (userRoleLevel < ROLE_HIERARCHY.ADMIN) {
        return apiForbidden('Event is locked. Only admins can modify locked events.');
      }
    }

    // Build update data
    const updateData: {
      title?: string;
      description?: string | null;
      eventDate?: Date | null;
      eventTime?: string | null;
      location?: string | null;
      locationCoords?: string | null;
      eventType?: EventType;
      status?: EventStatus;
      confidence?: number;
      importance?: number;
      verified?: boolean;
      positionX?: number;
      positionY?: number;
      width?: number;
      height?: number;
      zIndex?: number;
      isExpanded?: boolean;
      isLocked?: boolean;
      color?: string | null;
      externalId?: string | null;
      source?: string | null;
      reliability?: number;
      clusterId?: string | null;
    } = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return apiError('Event title cannot be empty');
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (eventDate !== undefined) {
      updateData.eventDate = eventDate ? new Date(eventDate) : null;
    }

    if (eventTime !== undefined) {
      updateData.eventTime = eventTime || null;
    }

    if (location !== undefined) {
      updateData.location = location?.trim() || null;
    }

    if (locationCoords !== undefined) {
      updateData.locationCoords = locationCoords || null;
    }

    if (eventType !== undefined) {
      if (!Object.values(EventType).includes(eventType)) {
        return apiError('Invalid event type');
      }
      updateData.eventType = eventType;
    }

    if (status !== undefined) {
      if (!Object.values(EventStatus).includes(status)) {
        return apiError('Invalid event status');
      }
      updateData.status = status;
    }

    if (confidence !== undefined) {
      if (confidence < 0 || confidence > 100) {
        return apiError('Confidence must be between 0 and 100');
      }
      updateData.confidence = confidence;
    }

    if (importance !== undefined) {
      if (importance < 0 || importance > 100) {
        return apiError('Importance must be between 0 and 100');
      }
      updateData.importance = importance;
    }

    if (verified !== undefined) {
      updateData.verified = Boolean(verified);
    }

    // Position updates
    if (positionX !== undefined) {
      updateData.positionX = Number(positionX);
    }

    if (positionY !== undefined) {
      updateData.positionY = Number(positionY);
    }

    if (width !== undefined) {
      updateData.width = Number(width);
    }

    if (height !== undefined) {
      updateData.height = Number(height);
    }

    if (zIndex !== undefined) {
      updateData.zIndex = Number(zIndex);
    }

    if (isExpanded !== undefined) {
      updateData.isExpanded = Boolean(isExpanded);
    }

    if (isLocked !== undefined) {
      updateData.isLocked = Boolean(isLocked);
    }

    if (color !== undefined) {
      updateData.color = color || null;
    }

    if (externalId !== undefined) {
      updateData.externalId = externalId || null;
    }

    if (source !== undefined) {
      updateData.source = source?.trim() || null;
    }

    if (reliability !== undefined) {
      if (reliability < 0 || reliability > 100) {
        return apiError('Reliability must be between 0 and 100');
      }
      updateData.reliability = reliability;
    }

    if (clusterId !== undefined) {
      if (clusterId !== null) {
        const cluster = await db.cluster.findFirst({
          where: { id: clusterId, projectId: existingEvent.projectId },
        });
        if (!cluster) {
          return apiError('Cluster not found in this project');
        }
      }
      updateData.clusterId = clusterId;
    }

    const event = await db.event.update({
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
        cluster: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return apiSuccess(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return apiError('Failed to update event', 500);
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing event
    const existingEvent = await db.event.findUnique({
      where: { id },
      select: { id: true, projectId: true, isLocked: true, title: true },
    });

    if (!existingEvent) {
      return apiNotFound('Event not found');
    }

    // Check project access - need at least MEMBER role to delete events
    const accessResult = await hasProjectAccess(
      existingEvent.projectId,
      authResult.user.id,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Check if event is locked - only OWNER/ADMIN can delete locked events
    if (existingEvent.isLocked) {
      const memberRole = accessResult.memberRole as MemberRole;
      const userRoleLevel = ROLE_HIERARCHY[memberRole] || 0;
      if (userRoleLevel < ROLE_HIERARCHY.ADMIN) {
        return apiForbidden('Event is locked. Only admins can delete locked events.');
      }
    }

    // Delete event (cascade will handle relationships)
    await db.event.delete({
      where: { id },
    });

    return apiSuccess({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return apiError('Failed to delete event', 500);
  }
}
