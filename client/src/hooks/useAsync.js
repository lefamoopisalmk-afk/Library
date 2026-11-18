import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an async loader, tracks loading and error state, and re-runs it when
// the dependencies change or reload() is called.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef
      .current()
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (alive) setState((s) => ({ ...s, error, loading: false }));
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload, setData };
}
