import { type PaginatedApiResponse } from '@/types/apiResponse';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './ui/pagination';

const PaginationGroup = ({ data }: { data: PaginatedApiResponse }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const pagesCount = Math.ceil(data.data.count / data.data.pageSize);
  const firstPages = pagesCount > 1 ? [1, 2] : [1];

  const middlePages = useMemo(() => {
    const pages: number[] = [];

    for (
      let i: number = Math.max(data.data.page - 2, 3);
      i <= Math.min(data.data.page + 2, pagesCount - 2) && i <= pagesCount - 2;
      i++
    ) {
      pages.push(i);
    }

    return pages;
  }, [data, pagesCount]);

  const lastPages = useMemo(() => {
    const pages: number[] = [];

    if (pagesCount > 2) {
      for (let i: number = Math.max(pagesCount - 1, 3); i <= pagesCount; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [pagesCount]);

  const showFirstToMiddleConnector =
    middlePages.length === 0
      ? false
      : (firstPages[firstPages.length - 1] ?? -1) + 1 !== middlePages[0];
  const showMiddleToLastConnector =
    middlePages.length === 0
      ? false
      : (middlePages[middlePages.length - 1] ?? -1) + 1 !== lastPages[0];

  function goToPage(page: number) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    current.set('page', page.toString());

    const search = current.toString();
    const query = search ? `?${search}` : '';
    void router.push(`${pathname}${query}`);
  }

  return (
    <>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => goToPage(data.data.page - 1)}
              className={data.data.page === 1 ? 'pointer-events-none' : ''}
            />
          </PaginationItem>
          {firstPages.map((p) => (
            <PaginationItem key={p} className="hidden sm:block">
              <PaginationLink
                onClick={() => goToPage(p)}
                className={data.data.page === p ? 'pointer-events-none' : ''}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem
            className={
              !showFirstToMiddleConnector ? 'hidden' : 'hidden sm:block'
            }>
            <PaginationEllipsis />
          </PaginationItem>
          {middlePages.map((p) => (
            <PaginationItem key={p} className="hidden sm:block">
              <PaginationLink
                onClick={() => goToPage(p)}
                className={data.data.page === p ? 'pointer-events-none' : ''}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem
            className={
              !showMiddleToLastConnector ? 'hidden' : 'hidden sm:block'
            }>
            <PaginationEllipsis />
          </PaginationItem>
          {lastPages.map((p) => (
            <PaginationItem key={p} className="hidden sm:block">
              <PaginationLink
                onClick={() => goToPage(p)}
                className={data.data.page === p ? 'pointer-events-none' : ''}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => goToPage(data.data.page + 1)}
              className={
                data.data.page === lastPages[lastPages.length - 1] ||
                lastPages.length === 0
                  ? 'pointer-events-none'
                  : ''
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="flex justify-center items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
        Items {(data.data.page - 1) * data.data.pageSize + 1} -{' '}
        {Math.min(data.data.page * data.data.pageSize, data.data.count)} of{' '}
        {data.data.count}
      </div>
    </>
  );
};

export default PaginationGroup;
