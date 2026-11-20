"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError, isApiClientError } from "./client";
import { redirectToLogin } from "./redirect";

type Settled<T> = { status: "success"; data: T } | { status: "error"; error: unknown };

export type AsyncData<T> = ({ status: "loading" } | Settled<T>) & {
  /** Runs the request again, going back to the loading state. */
  reload: () => void;
  /** Updates loaded data in place, for example after a successful mutation. */
  setData: (update: (current: T) => T) => void;
};

type Options<T> = {
  /** Data that is already available; the first request is skipped. */
  initialData?: T;
};

/**
 * Loads data when a screen mounts or when `key` changes.
 *
 * - Results of an outdated key are ignored, so fast navigation cannot show
 *   the wrong data.
 * - The request is aborted when the component unmounts.
 * - A 401 response redirects to the login page instead of surfacing an error.
 */
export function useAsyncData<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  { initialData }: Options<T> = {},
): AsyncData<T> {
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}#${attempt}`;

  const [result, setResult] = useState<{ requestKey: string; state: Settled<T> } | null>(() =>
    initialData === undefined
      ? null
      : { requestKey, state: { status: "success", data: initialData } },
  );

  // The request that initialData already answers.
  const answeredKey = useRef(initialData === undefined ? null : requestKey);

  // Always call the latest `load` without making it an effect dependency.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (answeredKey.current === requestKey) {
      return;
    }

    const controller = new AbortController();

    loadRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, state: { status: "success", data } });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) {
          return;
        }

        if (isApiClientError(error) && error.status === 401) {
          redirectToLogin();
          return;
        }

        setResult({ requestKey, state: { status: "error", error } });
      });

    return () => controller.abort();
  }, [requestKey]);

  const reload = useCallback(() => {
    answeredKey.current = null;
    setAttempt((current) => current + 1);
  }, []);

  const setData = useCallback((update: (current: T) => T) => {
    setResult((current) =>
      current?.state.status === "success"
        ? { ...current, state: { status: "success", data: update(current.state.data) } }
        : current,
    );
  }, []);

  const state: { status: "loading" } | Settled<T> =
    result?.requestKey === requestKey ? result.state : { status: "loading" };

  return { ...state, reload, setData };
}
