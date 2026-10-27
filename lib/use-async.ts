"use client";

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export type AsyncState<T> = {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
  setData: (next: T | ((prev: T | undefined) => T)) => void;
};

/** Runs an async loader on mount and whenever deps change. Ignores stale responses. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = []): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const call = useRef(0);

  useEffect(() => {
    const id = ++call.current;
    setLoading(true);
    setError(undefined);
    loader()
      .then((d) => id === call.current && setData(d))
      .catch((e: unknown) => id === call.current && setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => id === call.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const set = useCallback((next: T | ((prev: T | undefined) => T)) => {
    setData((prev) => (typeof next === "function" ? (next as (p: T | undefined) => T)(prev) : next));
  }, []);

  return { data, error, loading, reload, setData: set };
}

export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  return e instanceof Error && e.message ? e.message : fallback;
}
