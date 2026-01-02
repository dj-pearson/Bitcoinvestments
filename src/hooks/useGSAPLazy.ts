import { useEffect, useState, useRef } from 'react';
import type { RefObject } from 'react';

interface GSAPInstance {
  gsap: typeof import('gsap').gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
  useGSAP: typeof import('@gsap/react').useGSAP;
}

let gsapInstance: GSAPInstance | null = null;
let loadingPromise: Promise<GSAPInstance> | null = null;

/**
 * Lazily loads GSAP and its plugins only when needed.
 * This prevents the ~113KB animation bundle from loading on pages that don't use animations.
 */
async function loadGSAP(): Promise<GSAPInstance> {
  if (gsapInstance) return gsapInstance;

  if (!loadingPromise) {
    loadingPromise = (async () => {
      const [gsapModule, scrollTriggerModule, reactGsapModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('@gsap/react'),
      ]);

      const { gsap } = gsapModule;
      const { ScrollTrigger } = scrollTriggerModule;
      const { useGSAP } = reactGsapModule;

      // Register plugins
      gsap.registerPlugin(ScrollTrigger);

      gsapInstance = { gsap, ScrollTrigger, useGSAP };
      return gsapInstance;
    })();
  }

  return loadingPromise;
}

/**
 * Hook that lazily loads GSAP when the component mounts.
 * Returns null while loading, then the GSAP instance once ready.
 */
export function useGSAPLazy(): GSAPInstance | null {
  const [instance, setInstance] = useState<GSAPInstance | null>(gsapInstance);

  useEffect(() => {
    if (!instance) {
      loadGSAP().then(setInstance);
    }
  }, [instance]);

  return instance;
}

/**
 * Simple animation hook that lazily loads GSAP.
 * Executes the callback once GSAP is loaded.
 */
export function useLazyAnimation(
  callback: (gsap: GSAPInstance['gsap']) => void | (() => void),
  deps: React.DependencyList = [],
  _scope?: RefObject<HTMLElement | null>
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let cleanup: void | (() => void);

    loadGSAP().then(({ gsap }) => {
      cleanup = callbackRef.current(gsap);
    });

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export { loadGSAP };
