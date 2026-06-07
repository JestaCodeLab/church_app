import { useEffect } from 'react';
import { driver } from 'driver.js';
import { PAGE_TOURS } from '../config/pageTours';

const storageKey = (pageKey: string) => `tour_seen_${pageKey}`;

export function usePageTour(pageKey: string) {
  useEffect(() => {
    if (localStorage.getItem(storageKey(pageKey)) === 'true') return;

    const steps = PAGE_TOURS[pageKey];
    if (!steps) return;

    const driverObj = driver({
      showProgress: true,
      steps,
      onDestroyed: () => {
        localStorage.setItem(storageKey(pageKey), 'true');
      },
    });

    const timer = setTimeout(() => driverObj.drive(), 300);

    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [pageKey]);
}
