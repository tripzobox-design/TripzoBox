import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop ensures that whenever the user navigates to a new page or clicks a link,
 * the viewport resets to the top of the page.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search, key } = useLocation();

  useEffect(() => {
    // Temporarily bypass smooth scrolling to instantly position at page top on navigation
    const prevScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const raf = requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname, search, key]);

  useEffect(() => {
    // If user clicks a link pointing to the same page they are already on, scroll to top
    const handleLinkClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a');
      if (target && target.href) {
        try {
          const url = new URL(target.href, window.location.origin);
          if (
            url.origin === window.location.origin &&
            url.pathname === window.location.pathname &&
            !url.hash
          ) {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  return null;
};

export default ScrollToTop;
