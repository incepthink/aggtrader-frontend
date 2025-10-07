'use client';

import { useState, useCallback } from 'react';
import type { TSortDirection } from '@/lib/yearnfi/lib/types';

export type TPossibleSortBy = 
  | 'name' 
  | 'apy' 
  | 'tvl' 
  | 'available' 
  | 'deposited'
  | 'estAPY'
  | 'APY'
  | 'score'
  | 'featuringScore';

type UseQueryArgumentsProps = {
  defaultTypes?: string[];
  defaultCategories?: string[];
  defaultPathname?: string;
};

export function useQueryArguments({
  defaultTypes = [],
  defaultCategories = [],
}: UseQueryArgumentsProps) {
  const [search, setSearch] = useState<string>('');
  const [types, setTypes] = useState<string[] | null>(defaultTypes);
  const [categories, setCategories] = useState<string[] | null>(defaultCategories);
  const [chains, setChains] = useState<number[] | null>([1, 747474]); // Ethereum + Katana
  const [sortDirection, setSortDirection] = useState<TSortDirection>('');
  const [sortBy, setSortBy] = useState<TPossibleSortBy>('featuringScore');

  const onSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const onChangeTypes = useCallback((value: string[] | null) => {
    setTypes(value);
  }, []);

  const onChangeCategories = useCallback((value: string[] | null) => {
    setCategories(value);
  }, []);

  const onChangeChains = useCallback((value: number[] | null) => {
    setChains(value);
  }, []);

  const onChangeSortDirection = useCallback((value: TSortDirection | '') => {
    setSortDirection(value as TSortDirection);
  }, []);

  const onChangeSortBy = useCallback((value: TPossibleSortBy | '') => {
    setSortBy(value as TPossibleSortBy);
  }, []);

  const onReset = useCallback(() => {
    setSearch('');
    setTypes(defaultTypes);
    setCategories(defaultCategories);
    setChains([1, 747474]);
    setSortDirection('');
    setSortBy('featuringScore');
  }, [defaultTypes, defaultCategories]);

  return {
    search,
    types,
    categories,
    chains,
    sortDirection,
    sortBy,
    onSearch,
    onChangeTypes,
    onChangeCategories,
    onChangeChains,
    onChangeSortDirection,
    onChangeSortBy,
    onReset,
  };
}