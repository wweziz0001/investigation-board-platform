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
import { EvidenceType } from '@prisma/client';

// GET /api/evidence - List evidence (filter by projectId, eventId, evidenceType)
export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { page, limit, search, sortBy, sortOrder, projectId } = parseQueryParams(request);

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || undefined;
  const evidenceType = searchParams.get('evidenceType') || undefined;
  const isVerified = searchParams.get('isVerified');
  const isConfidential = searchParams.get('isConfidential');

  // Project ID is required for listing evidence
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
      evidenceType?: EvidenceType;
      isVerified?: boolean;
      isConfidential?: boolean;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        fileName?: { contains: string; mode: 'insensitive' };
        collectedBy?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      projectId,
    };

    // Filter by event
    if (eventId) {
      where.eventId = eventId;
    }

    // Filter by evidence type
    if (evidenceType && Object.values(EvidenceType).includes(evidenceType as EvidenceType)) {
      where.evidenceType = evidenceType as EvidenceType;
    }

    // Filter by verification status
    if (isVerified !== null && isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    // Filter by confidentiality
    if (isConfidential !== null && isConfidential !== undefined) {
      where.isConfidential = isConfidential === 'true';
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { collectedBy: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.evidence.count({ where });

    // Get evidence
    const evidence = await db.evidence.findMany({
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
        event: {
          select: {
            id: true,
            title: true,
            eventType: true,
          },
        },
        _count: {
          select: {
            notes: true,
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

    return apiSuccess(evidence, 200, meta);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return apiError('Failed to fetch evidence', 500);
  }
}

// POST /api/evidence - Create evidence
export async function POST(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  // Only ADMIN and INVESTIGATOR can create evidence
  if (authResult.user.role === 'VIEWER') {
    return apiForbidden('Viewers cannot create evidence');
  }

  try {
    const body = await request.json();
    const {
      projectId,
      eventId,
      title,
      description,
      evidenceType = 'DOCUMENT',
      fileName,
      filePath,
      fileSize,
      mimeType,
      hash,
      externalUrl,
      externalSource,
      collectedDate,
      collectedBy,
      chainOfCustody,
      isVerified = false,
      isConfidential = false,
      accessLevel = 0,
    } = body;

    // Validate required fields
    if (!projectId) {
      return apiError('Project ID is required');
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return apiError('Evidence title is required');
    }

    // Validate evidence type
    if (evidenceType && !Object.values(EvidenceType).includes(evidenceType)) {
      return apiError('Invalid evidence type');
    }

    // Validate access level
    if (accessLevel < 0 || accessLevel > 3) {
      return apiError('Access level must be between 0 and 3');
    }

    // Validate file size if provided
    if (fileSize !== undefined && fileSize < 0) {
      return apiError('File size cannot be negative');
    }

    // Check project access - need at least MEMBER role to create evidence
    const accessResult = await hasProjectAccess(authResult.user.id, projectId, 'MEMBER');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // If eventId is provided, verify it belongs to the project
    if (eventId) {
      const event = await db.event.findFirst({
        where: { id: eventId, projectId },
      });
      if (!event) {
        return apiError('Event not found in this project');
      }
    }

    // Create evidence
    const evidence = await db.evidence.create({
      data: {
        projectId,
        eventId: eventId || null,
        title: title.trim(),
        description: description?.trim() || null,
        evidenceType: evidenceType as EvidenceType,
        fileName: fileName?.trim() || null,
        filePath: filePath?.trim() || null,
        fileSize: fileSize || null,
        mimeType: mimeType?.trim() || null,
        hash: hash?.trim() || null,
        externalUrl: externalUrl?.trim() || null,
        externalSource: externalSource?.trim() || null,
        collectedDate: collectedDate ? new Date(collectedDate) : null,
        collectedBy: collectedBy?.trim() || null,
        chainOfCustody: chainOfCustody || null,
        isVerified,
        isConfidential,
        accessLevel,
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
        event: {
          select: {
            id: true,
            title: true,
            eventType: true,
          },
        },
      },
    });

    return apiCreated(evidence);
  } catch (error) {
    console.error('Error creating evidence:', error);
    return apiError('Failed to create evidence', 500);
  }
}
