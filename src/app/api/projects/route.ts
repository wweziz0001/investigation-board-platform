import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiCreated,
  parseQueryParams,
  calculatePagination,
} from '@/lib/api-utils';
import { ProjectStatus, ProjectPriority, MemberRole } from '@prisma/client';

// GET /api/projects - List all projects user has access to
export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const { page, limit, search, sortBy, sortOrder, status } =
    parseQueryParams(request);

  try {
    // Build where clause
    const where: {
      isArchived: boolean;
      status?: ProjectStatus;
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
      AND?: Array<{
        OR: Array<
          | { createdById: string }
          | { members: { some: { userId: string } } }
        >;
      }>;
    } = {
      isArchived: false,
    };

    // Filter by status
    if (status && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      where.status = status as ProjectStatus;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Access control: user can see projects they own or are a member of
    // System admins can see all projects
    if (authResult.user.role !== 'ADMIN') {
      where.AND = [
        {
          OR: [
            { createdById: authResult.user.id },
            { members: { some: { userId: authResult.user.id } } },
          ],
        },
      ];
    }

    // Get total count
    const total = await db.project.count({ where });

    // Get projects
    const projects = await db.project.findMany({
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
        _count: {
          select: {
            events: true,
            members: true,
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

    return apiSuccess(projects, 200, meta);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return apiError('Failed to fetch projects', 500);
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  // Only ADMIN and INVESTIGATOR can create projects
  if (authResult.user.role === 'VIEWER') {
    return apiError('Viewers cannot create projects', 403);
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      status = 'PLANNING',
      priority = 'MEDIUM',
      startDate,
      endDate,
      boardViewport,
      boardSettings,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return apiError('Project name is required');
    }

    // Validate status
    if (status && !Object.values(ProjectStatus).includes(status)) {
      return apiError('Invalid project status');
    }

    // Validate priority
    if (priority && !Object.values(ProjectPriority).includes(priority)) {
      return apiError('Invalid project priority');
    }

    // Create project
    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: status as ProjectStatus,
        priority: priority as ProjectPriority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        boardViewport: boardViewport || null,
        boardSettings: boardSettings || null,
        createdById: authResult.user.id,
        // Add creator as OWNER member
        members: {
          create: {
            userId: authResult.user.id,
            role: MemberRole.OWNER,
          },
        },
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

    return apiCreated(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return apiError('Failed to create project', 500);
  }
}
