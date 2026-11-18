import { useEffect, useRef } from 'react';

// Adds the "is-visible" class to every [data-reveal] element inside the
// returned ref once it scrolls into view. CSS does the rest.
export function useReveal(threshold = 0.15) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const targets = root.matches('[data-reveal]') ? [root] : [...root.querySelectorAll('[data-reveal]')];

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }

    // Elements are only hidden once this flag is on, so content is never
    // stuck invisible when scripts fail to run.
    document.documentElement.classList.add('reveal-ready');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}
