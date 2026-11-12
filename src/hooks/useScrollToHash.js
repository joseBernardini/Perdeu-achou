import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function useScrollToHash() {
  const { hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }

    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  }, [hash, key]);
}

export default useScrollToHash;
