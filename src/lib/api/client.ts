import type { z } from "zod";
import {
  apiErrorResponseSchema,
  apiSuccessSchema,
  type ApiErrorCode,
  type FieldErrors,
} from "@/lib/contracts/common";

/** Backend error codes plus the two failures that only the client can detect. */
export type ApiClientErrorCode = ApiErrorCode | "NETWORK_ERROR" | "INVALID_RESPONSE";

export class ApiClientError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;
  readonly code: ApiClientErrorCode;
  readonly fieldErrors?: FieldErrors;

  constructor(
    status: number,
    code: ApiClientErrorCode,
    message: string,
    fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

/** True for the rejection of a request that was cancelled with an AbortSignal. */
export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && "name" in error && error.name === "AbortError"
  );
}

type ApiRequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  /** Zod schema of the `data` property of a successful response. */
  schema: z.ZodType<T>;
  signal?: AbortSignal;
};

/**
 * Calls the application backend and returns the validated `data` payload.
 *
 * Every failure is thrown as an ApiClientError (except aborted requests), so
 * callers handle HTTP errors, network failures, and malformed responses in one
 * place. This client only talks to same-origin `/api` routes: the browser never
 * calls the AI provider directly.
 */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, schema, signal }: ApiRequestOptions<T>,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(new URL(path, window.location.origin), {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiClientError(0, "NETWORK_ERROR", "Could not reach the server.");
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(payload);

    if (parsedError.success) {
      const { code, message, fieldErrors } = parsedError.data.error;
      throw new ApiClientError(response.status, code, message, fieldErrors);
    }

    throw new ApiClientError(
      response.status,
      "INVALID_RESPONSE",
      "The server returned an unexpected error.",
    );
  }

  const parsed = apiSuccessSchema(schema).safeParse(payload);

  if (!parsed.success) {
    throw new ApiClientError(
      response.status,
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
    );
  }

  return parsed.data.data;
}
