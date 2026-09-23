/**
 * Course progress stored in this browser (localStorage).
 *
 * Progress is only what the visitor has actually marked complete; nothing is
 * inferred from which module is open. Storage is read inside an effect so the
 * first render (and any prerender) shows the neutral, not-started state.
 *
 * TODO(db): when accounts are enabled, sync this to a slug-keyed table such as
 * course_progress(user_id, course_slug, module_id, completed_at). The existing
 * interactive-courses migration keys courses by UUID and has no mapping to the
 * static course slugs, so there is no table to sync to yet.
 */

import { useCallback, useEffect, useState } from 'react';

const KEY_PREFIX = 'course-progress:';

function storageKey(courseId: string) {
  return `${KEY_PREFIX}${courseId}`;
}

function readProgress(courseId: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(courseId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeProgress(courseId: string, moduleIds: string[]): boolean {
  try {
    window.localStorage.setItem(storageKey(courseId), JSON.stringify(moduleIds));
    return true;
  } catch {
    return false;
  }
}

export interface CourseProgress {
  /** Module ids marked complete (only known after mount). */
  completed: Set<string>;
  /** False until storage has been read on the client. */
  loaded: boolean;
  /** False if the browser blocked storage (private mode etc.). */
  persistent: boolean;
  setComplete: (moduleId: string, done: boolean) => void;
  reset: () => void;
}

export function useCourseProgress(courseId: string): CourseProgress {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    setCompleted(new Set(readProgress(courseId)));
    setLoaded(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(courseId)) {
        setCompleted(new Set(readProgress(courseId)));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [courseId]);

  const setComplete = useCallback(
    (moduleId: string, done: boolean) => {
      // Re-read storage so a change made in another tab is not overwritten.
      const next = new Set(readProgress(courseId));
      if (done) next.add(moduleId);
      else next.delete(moduleId);
      setPersistent(writeProgress(courseId, Array.from(next)));
      setCompleted(next);
    },
    [courseId]
  );

  const reset = useCallback(() => {
    setCompleted(new Set());
    setPersistent(writeProgress(courseId, []));
  }, [courseId]);

  return { completed, loaded, persistent, setComplete, reset };
}
