import { db } from '@/server/db';
import { favorite } from '@/server/db/schema';
import { ratelimit } from '@/server/ratelimit';
import { auth, currentUser } from '@clerk/nextjs/server';
import { and, eq, inArray } from 'drizzle-orm';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { sessionClaims, userId } = await auth();
  const activeUser = await currentUser();

  if (
    !sessionClaims ||
    !activeUser ||
    sessionClaims.admin !== true ||
    !activeUser.emailAddresses[0]
  ) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const foodId = (await params).id;

  if (!foodId) {
    return new Response(JSON.stringify({ message: 'No food id provided' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const item = await db.query.food.findFirst({
    where: (foods, { eq }) => eq(foods.id, Number(foodId)),
  });

  if (!item) {
    return new Response(
      JSON.stringify({ message: `Food '${foodId}' does not exist` }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  await db.insert(favorite).values({
    id: Number(foodId),
    user: activeUser.emailAddresses[0].emailAddress,
  });

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { sessionClaims, userId } = await auth();
  const activeUser = await currentUser();

  if (!sessionClaims || !activeUser || sessionClaims.admin !== true) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const foodId = (await params).id;

  if (!foodId) {
    return new Response(JSON.stringify({ message: 'No food id provided' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const item = await db.query.food.findFirst({
    where: (foods, { eq }) => eq(foods.id, Number(foodId)),
  });

  if (!item) {
    return new Response(
      JSON.stringify({ message: `Food '${foodId}' does not exist` }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  await db.delete(favorite).where(
    and(
      eq(favorite.id, Number(foodId)),
      inArray(
        favorite.user,
        activeUser.emailAddresses.flatMap((email) => email.emailAddress),
      ),
      eq(favorite.user, favorite.user),
    ),
  );

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
