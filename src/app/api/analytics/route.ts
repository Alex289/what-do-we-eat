import { db } from '@/server/db';
import { analytics } from '@/server/db/schema';
import { ratelimit } from '@/server/ratelimit';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const session = await auth();

  if (!session.userId) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const { success } = await ratelimit.limit(session.userId);

  if (!success) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  let { name, picked } = (await req.json()) as {
    name: string;
    picked: boolean;
  };

  try {
    name = String(name);
    picked = Boolean(picked);
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ message: 'Bad request' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const existingFood = await db.query.food.findFirst({
    where: (foods, { eq }) => eq(foods.name, name),
  });

  if (!existingFood) {
    return new Response(JSON.stringify({ message: 'Food does not exist' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  revalidatePath('/analytics');

  await db.insert(analytics).values({
    name: name,
    picked: picked,
  });

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
