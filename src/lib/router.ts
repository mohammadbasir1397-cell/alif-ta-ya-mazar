import { useEffect, useState, useCallback } from 'react';

/** A minimal hash-based router for SPA navigation without dependencies. */
export interface Route {
  path: string;
  params: Record<string, string>;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const parts = raw.split('/').filter(Boolean);
  return { path: '/' + parts.join('/'), params: {} };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to.startsWith('#') ? to : '#' + to;
  }, []);

  return { route, navigate };
}

/** Match the current path against a pattern like "/product/:id". Returns params or null. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const ap = path.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    } else if (pp[i] !== ap[i]) {
      return null;
    }
  }
  return params;
}
