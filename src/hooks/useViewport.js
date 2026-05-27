import { useState, useEffect } from 'react';

export default function useViewport() {
  const snap = () => {
    const w = window.innerWidth;
    return { width: w, isMobile: w < 768, isTablet: w >= 768 && w < 1200, isDesktop: w >= 1200 };
  };
  const [vp, setVp] = useState(snap);
  useEffect(() => {
    const fn = () => setVp(snap());
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return vp;
}
