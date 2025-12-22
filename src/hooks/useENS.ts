import { useState, useEffect, useCallback } from 'react';
import {
  resolveENSName,
  lookupENSName,
  getENSAvatar,
  getENSProfile,
  looksLikeENSName,
  formatAddressWithENS,
  type ENSProfile,
} from '../services/ensResolution';

interface UseENSResolveResult {
  address: string | null;
  isLoading: boolean;
  error: string | null;
  resolve: (name: string) => Promise<string | null>;
}

interface UseENSLookupResult {
  name: string | null;
  isLoading: boolean;
  error: string | null;
  lookup: (address: string) => Promise<string | null>;
}

interface UseENSProfileResult {
  profile: ENSProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to resolve an ENS name to an address
 */
export function useENSResolve(ensName?: string): UseENSResolveResult {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async (name: string): Promise<string | null> => {
    if (!name || !looksLikeENSName(name)) {
      setAddress(null);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await resolveENSName(name);
      setAddress(result.address);
      setError(result.error);
      return result.address;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve';
      setError(errorMessage);
      setAddress(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ensName) {
      resolve(ensName);
    } else {
      setAddress(null);
      setError(null);
    }
  }, [ensName, resolve]);

  return { address, isLoading, error, resolve };
}

/**
 * Hook to lookup ENS name for an address
 */
export function useENSLookup(address?: string): UseENSLookupResult {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (addr: string): Promise<string | null> => {
    if (!addr || !addr.startsWith('0x') || addr.length !== 42) {
      setName(null);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await lookupENSName(addr);
      setName(result.name);
      setError(result.error);
      return result.name;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup';
      setError(errorMessage);
      setName(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      lookup(address);
    } else {
      setName(null);
      setError(null);
    }
  }, [address, lookup]);

  return { name, isLoading, error, lookup };
}

/**
 * Hook to get full ENS profile
 */
export function useENSProfile(nameOrAddress?: string): UseENSProfileResult {
  const [profile, setProfile] = useState<ENSProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!nameOrAddress) {
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getENSProfile(nameOrAddress);
      setProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get profile');
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [nameOrAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, isLoading, error, refresh };
}

/**
 * Hook to get ENS avatar
 */
export function useENSAvatar(nameOrAddress?: string): {
  avatar: string | null;
  isLoading: boolean;
} {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!nameOrAddress) {
      setAvatar(null);
      return;
    }

    setIsLoading(true);

    getENSAvatar(nameOrAddress)
      .then(setAvatar)
      .finally(() => setIsLoading(false));
  }, [nameOrAddress]);

  return { avatar, isLoading };
}

/**
 * Hook to format address with ENS name
 */
export function useFormattedAddress(
  address?: string,
  truncate: boolean = true
): {
  formatted: string;
  ensName: string | null;
  isLoading: boolean;
} {
  const { name, isLoading } = useENSLookup(address);

  const formatted = address
    ? formatAddressWithENS(address, name, truncate)
    : '';

  return { formatted, ensName: name, isLoading };
}
