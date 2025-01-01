import { db } from '@/server/db';
import { food } from '@/server/db/schema';
import { ratelimit } from '@/server/ratelimit';
import { type PaginatedApiResponse } from '@/types/apiResponse';
import { auth } from '@clerk/nextjs/server';
import { count, like } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const queries = req.nextUrl.searchParams;

  const sort = queries.get('sort');
  const page = parseInt(queries.get('page') ?? '1') || 1;
  const amount = parseInt(queries.get('amount') ?? '40') || 40;
  const search = queries.get('search') ?? '';

  const cheeseometer = queries.get('cheeseometer');
  const effort = queries.get('effort');

  const itemCount = await db
    .select({ count: count() })
    .from(food)
    .where(like(food.name, search.length > 1 ? `%${search}%` : '%'));

  const items = await db.query.food.findMany({
    limit: amount,
    offset: (page - 1) * amount,
    where: (foods, { like, and, eq }) =>
      and(
        like(foods.name, search.length > 1 ? `%${search}%` : '%'),
        like(foods.tags, queries.get('tags') ?? '%'),
        queries.get('deliverable')
          ? eq(foods.deliverable, queries.get('deliverable') === 'true')
          : undefined,
        cheeseometer
          ? eq(foods.cheeseometer, parseInt(cheeseometer))
          : undefined,
        effort ? eq(foods.effort, parseInt(effort)) : undefined,
      ),
    orderBy: (foods, { asc, desc }) => [
      sort === 'desc' ? desc(foods.name) : asc(foods.name),
    ],
  });

  const response: PaginatedApiResponse = {
    status: 'success',
    data: {
      count: itemCount[0]?.count ?? 0,
      items: items,
      page: page,
      pageSize: amount,
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(req: Request) {
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

  const { name, image, cheeseometer, deliverable, tags, effort } =
    (await req.json()) as {
      name: string;
      image: string;
      cheeseometer: number;
      deliverable: boolean;
      tags: string;
      effort: number;
    };

  const existingFood = await db.query.food.findFirst({
    where: (foods, { eq }) => eq(foods.name, name),
  });

  if (existingFood) {
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

  const foodCount = await db.select({ count: count() }).from(food);
  let nextAvailableId = foodCount[0]?.count ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const existingFood = await db.query.food.findFirst({
      where: (foods, { eq }) => eq(foods.id, nextAvailableId),
    });

    if (existingFood) {
      nextAvailableId++;
    } else {
      break;
    }
  }

  await db.insert(food).values({
    id: nextAvailableId,
    name: name,
    image: image,
    cheeseometer: cheeseometer,
    deliverable: deliverable,
    tags: tags,
    effort: effort,
  });

  revalidatePath('/');
  revalidatePath('/dashboard');

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
