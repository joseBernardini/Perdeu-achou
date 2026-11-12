import { useCallback, useEffect, useRef, useState } from 'react';

function useAsyncData(loader, dependencies) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const requestIdRef = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!silent) setState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const data = await loader();
      if (requestIdRef.current === requestId) setState({ status: 'success', data, error: null });
    } catch (error) {
      if (requestIdRef.current === requestId) setState({ status: 'error', data: null, error });
    }
  }, dependencies);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return { ...state, reload: load };
}

export default useAsyncData;
