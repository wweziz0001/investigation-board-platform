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
import { EvidenceType, MemberRole } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/evidence/[id] - Get evidence details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    const evidence = await db.evidence.findUnique({
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
        event: {
          select: {
            id: true,
            title: true,
            eventType: true,
            eventDate: true,
            location: true,
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

    if (!evidence) {
      return apiNotFound('Evidence not found');
    }

    // Check project access
    const accessResult = await hasProjectAccess(authResult.user.id, evidence.projectId);
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // Check access level for confidential evidence
    if (evidence.isConfidential && evidence.accessLevel > 0) {
      const memberRole = accessResult.memberRole as MemberRole;
      const roleLevelMap: Record<string, number> = {
        'VIEWER': 10,
        'MEMBER': 30,
        'ADMIN': 80,
        'OWNER': 100,
      };
      const userRoleLevel = roleLevelMap[memberRole] || 0;
      
      // accessLevel: 0=public, 1=members, 2=admin, 3=owner
      const requiredLevel = evidence.accessLevel * 30; // Rough mapping
      
      if (userRoleLevel < requiredLevel && authResult.user.role !== 'ADMIN') {
        return apiForbidden('Insufficient access level for this evidence');
      }
    }

    return apiSuccess(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return apiError('Failed to fetch evidence', 500);
  }
}

// PUT /api/evidence/[id] - Update evidence
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing evidence
    const existingEvidence = await db.evidence.findUnique({
      where: { id },
      select: { id: true, projectId: true, createdById: true, isConfidential: true, accessLevel: true },
    });

    if (!existingEvidence) {
      return apiNotFound('Evidence not found');
    }

    // Check project access - need at least MEMBER role to update evidence
    const accessResult = await hasProjectAccess(
      authResult.user.id,
      existingEvidence.projectId,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const body = await request.json();
    const {
      title,
      description,
      eventId,
      evidenceType,
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
      isVerified,
      isConfidential,
      accessLevel,
    } = body;

    // Build update data
    const updateData: {
      title?: string;
      description?: string | null;
      eventId?: string | null;
      evidenceType?: EvidenceType;
      fileName?: string | null;
      filePath?: string | null;
      fileSize?: number | null;
      mimeType?: string | null;
      hash?: string | null;
      externalUrl?: string | null;
      externalSource?: string | null;
      collectedDate?: Date | null;
      collectedBy?: string | null;
      chainOfCustody?: string | null;
      isVerified?: boolean;
      isConfidential?: boolean;
      accessLevel?: number;
    } = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return apiError('Evidence title cannot be empty');
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (eventId !== undefined) {
      if (eventId !== null) {
        const event = await db.event.findFirst({
          where: { id: eventId, projectId: existingEvidence.projectId },
        });
        if (!event) {
          return apiError('Event not found in this project');
        }
      }
      updateData.eventId = eventId;
    }

    if (evidenceType !== undefined) {
      if (!Object.values(EvidenceType).includes(evidenceType)) {
        return apiError('Invalid evidence type');
      }
      updateData.evidenceType = evidenceType;
    }

    if (fileName !== undefined) {
      updateData.fileName = fileName?.trim() || null;
    }

    if (filePath !== undefined) {
      updateData.filePath = filePath?.trim() || null;
    }

    if (fileSize !== undefined) {
      if (fileSize !== null && fileSize < 0) {
        return apiError('File size cannot be negative');
      }
      updateData.fileSize = fileSize;
    }

    if (mimeType !== undefined) {
      updateData.mimeType = mimeType?.trim() || null;
    }

    if (hash !== undefined) {
      updateData.hash = hash?.trim() || null;
    }

    if (externalUrl !== undefined) {
      updateData.externalUrl = externalUrl?.trim() || null;
    }

    if (externalSource !== undefined) {
      updateData.externalSource = externalSource?.trim() || null;
    }

    if (collectedDate !== undefined) {
      updateData.collectedDate = collectedDate ? new Date(collectedDate) : null;
    }

    if (collectedBy !== undefined) {
      updateData.collectedBy = collectedBy?.trim() || null;
    }

    if (chainOfCustody !== undefined) {
      updateData.chainOfCustody = chainOfCustody || null;
    }

    if (isVerified !== undefined) {
      updateData.isVerified = Boolean(isVerified);
    }

    if (isConfidential !== undefined) {
      updateData.isConfidential = Boolean(isConfidential);
    }

    if (accessLevel !== undefined) {
      if (accessLevel < 0 || accessLevel > 3) {
        return apiError('Access level must be between 0 and 3');
      }
      
      // Only ADMIN/OWNER can increase access level
      if (accessLevel > existingEvidence.accessLevel) {
        const memberRole = accessResult.memberRole as MemberRole;
        const userRoleLevel = ROLE_HIERARCHY[memberRole] || 0;
        if (userRoleLevel < ROLE_HIERARCHY.ADMIN && authResult.user.role !== 'ADMIN') {
          return apiForbidden('Only admins can increase access level');
        }
      }
      
      updateData.accessLevel = accessLevel;
    }

    const evidence = await db.evidence.update({
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
        event: {
          select: {
            id: true,
            title: true,
            eventType: true,
          },
        },
      },
    });

    return apiSuccess(evidence);
  } catch (error) {
    console.error('Error updating evidence:', error);
    return apiError('Failed to update evidence', 500);
  }
}

// DELETE /api/evidence/[id] - Delete evidence
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id } = await params;

  try {
    // Get existing evidence
    const existingEvidence = await db.evidence.findUnique({
      where: { id },
      select: { id: true, projectId: true, title: true, isConfidential: true, accessLevel: true },
    });

    if (!existingEvidence) {
      return apiNotFound('Evidence not found');
    }

    // Check project access - need at least MEMBER role to delete evidence
    const accessResult = await hasProjectAccess(
      authResult.user.id,
      existingEvidence.projectId,
      'MEMBER'
    );
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    // For confidential evidence with high access level, require ADMIN role
    if (existingEvidence.isConfidential && existingEvidence.accessLevel >= 2) {
      const memberRole = accessResult.memberRole as MemberRole;
      const userRoleLevel = ROLE_HIERARCHY[memberRole] || 0;
      if (userRoleLevel < ROLE_HIERARCHY.ADMIN && authResult.user.role !== 'ADMIN') {
        return apiForbidden('Only admins can delete confidential evidence with high access level');
      }
    }

    // Delete evidence (cascade will handle notes)
    await db.evidence.delete({
      where: { id },
    });

    return apiSuccess({ message: 'Evidence deleted successfully' });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    return apiError('Failed to delete evidence', 500);
  }
}
