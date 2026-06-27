import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';

export interface Pagination {
  currentPage: number;
  pages: number;
  totalItems: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

interface UsePaginatedQueryOptions {
  initialPage?: number;
  limit?: number;
}

/**
 * Hook for paginated data fetching with SWR caching.
 * Eliminates the need for duplicate useEffect + useState boilerplate across pages.
 *
 * Usage:
 * const fetcher = (params) => branchAPI.getBranches(params).then(res => ({
 *   items: res.data.data.branches,
 *   pagination: res.data.data.pagination
 * }));
 *
 * const { data, loading, error, currentPage, totalPages, totalItems, setPage, setSearch, setFilters } =
 *   usePaginatedQuery('branches', fetcher, { limit: 10 });
 *
 * SWR caches results per [key, page, search, filters] combination, so navigating back to a page
 * shows cached data instantly while silently revalidating in the background.
 */
export const usePaginatedQuery = <T,>(
  key: string,
  fetcher: (params: any) => Promise<PaginatedResponse<T>>,
  options: UsePaginatedQueryOptions = {}
) => {
  const { initialPage = 1, limit = 10 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Build SWR cache key with all parameters
  const swrKey = [key, currentPage, searchTerm, JSON.stringify(filters)];

  // SWR fetcher that passes params to the provided fetcher function
  const swrFetcher = () =>
    fetcher({
      page: currentPage,
      limit,
      ...(searchTerm && { search: searchTerm }),
      ...filters,
    });

  const { data, isLoading, error, mutate } = useSWR(swrKey, swrFetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000, // 1 minute dedup window
  });

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  const setSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const setPageFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    data: data?.items || [],
    pagination: data?.pagination || {
      currentPage: 1,
      pages: 1,
      totalItems: 0,
    },
    loading: isLoading,
    error,
    currentPage,
    totalPages: data?.pagination.pages || 1,
    totalItems: data?.pagination.totalItems || 0,
    setPage,
    setSearch,
    setFilters: setPageFilters,
    refetch,
  };
};
