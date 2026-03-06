import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-utils';

// GET /api/users/search - Search users by email (for adding to projects)
export async function GET(request: NextRequest) {
  const authResult = await getAuthUser(request);
  if (!authResult.user) {
    return apiUnauthorized(authResult.error);
  }

  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email || email.trim().length === 0) {
    return apiError('Email is required');
  }

  try {
    const user = await db.user.findFirst({
      where: {
        email: {
          equals: email.trim().toLowerCase(),
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });

    if (!user) {
      return apiSuccess(null);
    }

    return apiSuccess(user);
  } catch (error) {
    console.error('Error searching user:', error);
    return apiError('Failed to search user', 500);
  }
}
