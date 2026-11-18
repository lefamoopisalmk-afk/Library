import { useEffect, useState } from 'react';

// Returns the value once it has stopped changing for `delay` milliseconds.
// Used so a search box does not hit the API on every keystroke.
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
