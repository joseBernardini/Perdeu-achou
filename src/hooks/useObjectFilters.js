import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { clearFilters, parseFilters, removeActiveFilter, serializeFilters } from '../utils/objectFilters';

const FILTERS_STATE_MARKER = 'objectFilters';

function useObjectFilters() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => parseFilters(searchParams));
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (location.state?.[FILTERS_STATE_MARKER]) return;
    setFilters(parseFilters(new URLSearchParams(location.search)));
  }, [location.key]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    setSearchParams(serializeFilters(filters), { replace: true, state: { [FILTERS_STATE_MARKER]: true } });
  }, [filters, setSearchParams]);

  const updateFilters = useCallback((changes) => {
    setFilters((current) => ({ ...current, ...changes }));
  }, []);

  const toggleCategory = useCallback((categoryId) => {
    setFilters((current) => ({
      ...current,
      categories: current.categories.includes(categoryId)
        ? current.categories.filter((id) => id !== categoryId)
        : [...current.categories, categoryId],
    }));
  }, []);

  const removeFilter = useCallback((key) => {
    setFilters((current) => removeActiveFilter(current, key));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((current) => clearFilters(current));
  }, []);

  return { filters, updateFilters, toggleCategory, removeFilter, resetFilters };
}

export default useObjectFilters;
