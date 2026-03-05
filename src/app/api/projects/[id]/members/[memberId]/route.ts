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
  params: Promise<{ id: string; memberId: string }>;
}

// PUT /api/projects/[id]/members/[memberId] - Update member role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id, memberId } = await params;

  try {
    // Check project access - need ADMIN role to update members
    const accessResult = await hasProjectAccess(id, authResult.user.id, 'ADMIN');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const currentUserRole = accessResult.memberRole as MemberRole;
    const currentUserRoleLevel = ROLE_HIERARCHY[currentUserRole] || 0;

    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!role || !Object.values(MemberRole).includes(role)) {
      return apiError('Invalid member role');
    }

    // Get the member to update
    const member = await db.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!member || member.projectId !== id) {
      return apiNotFound('Member not found in this project');
    }

    const targetRoleLevel = ROLE_HIERARCHY[role as MemberRole] || 0;
    const memberCurrentRoleLevel = ROLE_HIERARCHY[member.role as MemberRole] || 0;

    // Cannot modify an OWNER unless you're also an OWNER
    if (member.role === MemberRole.OWNER && currentUserRole !== MemberRole.OWNER) {
      return apiForbidden('Only project owners can modify other owners');
    }

    // Cannot set someone as OWNER unless you're an OWNER
    if (role === MemberRole.OWNER && currentUserRole !== MemberRole.OWNER) {
      return apiForbidden('Only project owners can set members as owners');
    }

    // Cannot modify someone with higher or equal role
    if (memberCurrentRoleLevel >= currentUserRoleLevel && currentUserRole !== MemberRole.OWNER) {
      return apiForbidden('Cannot modify member with equal or higher role');
    }

    // Prevent removing the last OWNER
    if (member.role === MemberRole.OWNER && role !== MemberRole.OWNER) {
      const ownerCount = await db.projectMember.count({
        where: {
          projectId: id,
          role: MemberRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        return apiError('Cannot remove the last owner of the project');
      }
    }

    // Update member role
    const updatedMember = await db.projectMember.update({
      where: { id: memberId },
      data: { role: role as MemberRole },
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

    return apiSuccess(updatedMember);
  } catch (error) {
    console.error('Error updating member role:', error);
    return apiError('Failed to update member role', 500);
  }
}

// DELETE /api/projects/[id]/members/[memberId] - Remove member from project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { id, memberId } = await params;

  try {
    // Check project access - need ADMIN role to remove members
    const accessResult = await hasProjectAccess(id, authResult.user.id, 'ADMIN');
    if (!accessResult.hasAccess) {
      return apiForbidden(accessResult.error);
    }

    const currentUserRole = accessResult.memberRole as MemberRole;
    const currentUserRoleLevel = ROLE_HIERARCHY[currentUserRole] || 0;

    // Get the member to remove
    const member = await db.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!member || member.projectId !== id) {
      return apiNotFound('Member not found in this project');
    }

    const memberRoleLevel = ROLE_HIERARCHY[member.role as MemberRole] || 0;

    // Cannot remove an OWNER unless you're also an OWNER
    if (member.role === MemberRole.OWNER && currentUserRole !== MemberRole.OWNER) {
      return apiForbidden('Only project owners can remove other owners');
    }

    // Cannot remove someone with higher or equal role (except OWNER removing OWNER)
    if (memberRoleLevel >= currentUserRoleLevel && 
        !(currentUserRole === MemberRole.OWNER && member.role === MemberRole.OWNER)) {
      return apiForbidden('Cannot remove member with equal or higher role');
    }

    // Prevent removing the last OWNER
    if (member.role === MemberRole.OWNER) {
      const ownerCount = await db.projectMember.count({
        where: {
          projectId: id,
          role: MemberRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        return apiError('Cannot remove the last owner of the project');
      }
    }

    // Remove member
    await db.projectMember.delete({
      where: { id: memberId },
    });

    return apiSuccess({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return apiError('Failed to remove member', 500);
  }
}
