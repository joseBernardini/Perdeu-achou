import { useEffect } from 'react';
import { APP_NAME } from '../utils/constants';

function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

export default useDocumentTitle;
