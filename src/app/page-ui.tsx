'use client';

import { SignedIn } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import PaginationGroup from '@/components/pagination-group';
import { SkeletonCard } from '@/components/skeleton-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UpsertFood } from '@/components/upsert-food';
import fetcher from '@/lib/fetcher';
import { handleFood } from '@/lib/filter';
import { useDebounce } from '@/lib/useDebounce';

import type { Favorite } from '@/server/db/types';
import type { ApiResponse, PaginatedApiResponse } from '@/types/apiResponse';
import type { ChangeEvent } from 'react';

const Food = dynamic(() => import('@/components/food'));
const Dialog = dynamic(() => import('@/components/filter-dialog'));

export default function IndexPage({
  emailAddresses,
  isAdmin,
}: {
  emailAddresses: string[] | undefined;
  isAdmin: boolean;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = Number(searchParams.get('page') ?? 1);
  const amount = Number(searchParams.get('amount') ?? 40);
  const search = searchParams.get('search') ?? '';
  const randomize = searchParams.get('randomize') === 'true';
  const sort = searchParams.get('sort') ?? '';
  const effort = searchParams.get('effort') ?? '';
  const deliverable = searchParams.get('deliverable') ?? '';
  const cheeseometer = searchParams.get('cheeseometer') ?? '';
  const tags = searchParams.get('tags') ?? '';

  const debouncedSearch = useDebounce(search, 500);

  const { data, error, isLoading } = useSWR<PaginatedApiResponse, string>(
    `/api/food?page=${page}` +
      `${debouncedSearch !== '' ? '&search=' + debouncedSearch : ''}` +
      `${sort !== '' ? '&sort=' + sort : ''}` +
      `${amount !== 40 ? '&amount=' + amount : ''}` +
      `${effort !== '' ? '&effort=' + effort : ''}` +
      `${deliverable !== '' ? '&deliverable=' + deliverable : ''}` +
      `${cheeseometer !== '' ? '&cheeseometer=' + cheeseometer : ''}` +
      `${tags !== '' ? '&tags=' + tags : ''}`,
    fetcher,
  );
  const { data: favoriteData } = useSWR<ApiResponse<Favorite[]>>(
    '/api/food/favorite',
    fetcher,
  );

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    const newRandomize = randomize ? 'false' : 'true';

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('randomize', newRandomize);
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }

  function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    e.preventDefault();

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('search', e.target.value);
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  }

  async function submitAnalytics(picked: boolean) {
    const res = await fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        name: memoizedFoodList[0]?.name,
        picked,
      }),
    });

    if (res.status !== 200) {
      const data = (await res.json()) as { message: string };

      toast.error(
        `Failed saving choice '${picked ? 'Good one' : 'Bad one'}': ${
          data.message
        }`,
      );
      return;
    }

    toast.success(`Submitted choice '${picked ? 'Good one' : 'Bad one'}'`);
  }

  const memoizedFoodList = useMemo(
    () => handleFood(data?.data.items ?? [], randomize),
    [data, randomize],
  );

  if (error) {
    return <div className="m-10">Failed to load</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row">
        <div className="mx-2 flex justify-between sm:block 2xl:mx-8">
          <Button
            className="umami--click--random-food mx-3"
            onClick={handleClick}>
            {randomize ? 'Get food list' : 'Get random food'}
          </Button>
          <Suspense>
            <Dialog />
          </Suspense>
        </div>

        <Input
          type="text"
          placeholder="Search"
          onChange={handleSearch}
          defaultValue={search}
          className="mx-5 mt-2 sm:mt-0 w-auto sm:mx-0"
        />

        <div className="ml-auto mr-4 mt-2 sm:mt-0">
          {isAdmin ? <UpsertFood /> : null}
        </div>
      </div>
      {randomize && (
        <SignedIn>
          <div className="mb-2 ml-3 flex gap-3 p-2 2xl:ml-7">
            <Button
              className="bg-green-600 hover:bg-green-500 dark:bg-green-700 dark:hover:bg-green-800"
              onClick={() => submitAnalytics(true)}>
              Good choice
            </Button>

            <Button
              variant="destructive"
              onClick={() => submitAnalytics(false)}>
              Bad choice
            </Button>
          </div>
        </SignedIn>
      )}
      <Suspense>
        {data?.data && favoriteData?.data && (
          <Food
            foodList={memoizedFoodList}
            favorite={favoriteData.data}
            emailAddresses={emailAddresses}
            isAdmin={isAdmin}
          />
        )}
      </Suspense>

      <ul className="md:grid-flow-column 2xl:grid-cols-fit mx-4 mt-3 grid gap-6 sm:grid-cols-2 md:mt-0 lg:grid-cols-3 xl:grid-cols-4 2xl:mx-8 2xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: amount }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : null}
      </ul>

      {data?.data ? <PaginationGroup data={data} /> : null}
    </div>
  );
}
