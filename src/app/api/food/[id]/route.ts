import { db } from '@/server/db';
import { analytics, favorite, food } from '@/server/db/schema';
import { ratelimit } from '@/server/ratelimit';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { sessionClaims, userId } = await auth();

  if (!sessionClaims || sessionClaims.admin !== true) {
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
  const { name, image, cheeseometer, deliverable, tags, effort } =
    (await req.json()) as {
      name: string;
      image: string;
      cheeseometer: number;
      deliverable: boolean;
      tags: string;
      effort: number;
    };

  const item = await db.query.food.findFirst({
    where: (foods, { eq }) => eq(foods.id, Number(foodId)),
  });

  if (!item) {
    return new Response(
      JSON.stringify({ message: `Food '${foodId}' not found` }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  const existingFoodByName = await db.query.food.findFirst({
    where: (foods, { eq }) => eq(foods.name, name),
  });

  if (existingFoodByName && existingFoodByName.id !== Number(foodId)) {
    return new Response(
      JSON.stringify({ message: `Food '${name}' already exists` }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  const result = await db
    .update(food)
    .set({
      name: name,
      image: image,
      cheeseometer: cheeseometer,
      deliverable: deliverable,
      tags: tags,
      effort: effort,
    })
    .where(eq(food.id, Number(foodId)));

  await db
    .update(analytics)
    .set({ name })
    .where(eq(analytics.id, Number(foodId)));

  revalidatePath('/');
  revalidatePath('/dashboard');

  return new Response(JSON.stringify({ status: 'success', data: [result] }), {
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

  if (!sessionClaims || sessionClaims.admin !== true) {
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

  const existingFood = await db.query.food.findFirst({
    where: (foods, { eq }) => eq(foods.id, Number(foodId)),
  });

  if (!existingFood) {
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

  await db.delete(food).where(eq(food.id, Number(foodId)));
  await db.delete(favorite).where(eq(favorite.id, Number(foodId)));
  await db.delete(analytics).where(eq(analytics.id, Number(foodId)));

  revalidatePath('/');
  revalidatePath('/dashboard');

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
