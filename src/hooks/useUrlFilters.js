import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function readFilters(searchParams, keys) {
  return Object.fromEntries(keys.map((key) => [key, searchParams.get(key) ?? '']));
}

function useUrlFilters(keys, isValid = () => true) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => {
    const initial = readFilters(searchParams, keys);
    return Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, isValid(key, value) ? value : '']));
  });
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const updateFilter = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(Object.fromEntries(keys.map((key) => [key, ''])));
  }, [keys]);

  return { filters, updateFilter, clearFilters };
}

export default useUrlFilters;
