/**
 * useApiToastBridge
 *
 * Connects the apiClient module (which lives outside React) to the
 * ToastContext (which lives inside React). Call this hook once in a
 * component that has access to both contexts – typically in App.tsx
 * inside the ToastProvider.
 *
 * This enables the apiClient to show user-facing error/warning toasts
 * when API requests fail, without requiring every service to manually
 * import and use toast hooks.
 */

import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { registerToastHandlers } from '../lib/apiClient';

export function useApiToastBridge(): void {
  const { error, warning } = useToast();

  useEffect(() => {
    registerToastHandlers(error, warning);
  }, [error, warning]);
}
