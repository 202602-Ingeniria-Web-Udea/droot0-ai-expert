import { isApiClientError, type ApiClientErrorCode } from "./client";

const MESSAGES: Partial<Record<ApiClientErrorCode, string>> = {
  UNAUTHENTICATED: "Your session has ended. Log in again to continue.",
  FORBIDDEN: "You do not have permission to do this.",
  NOT_FOUND: "This item could not be found.",
  VALIDATION_ERROR: "Check the highlighted fields and try again.",
  RATE_LIMITED: "Too many requests. Wait a moment and try again.",
  AI_PROVIDER_ERROR: "The assistant is unavailable right now. Try again in a moment.",
  AI_TIMEOUT: "The assistant took too long to respond. Try again.",
  NETWORK_ERROR: "Could not reach the server. Check your connection and try again.",
};

const FALLBACK = "Something went wrong. Try again.";

/**
 * Text shown to the user for a failed request.
 *
 * Conflict messages come from the backend because they describe a specific
 * business rule (for example, "The last administrator cannot be demoted.").
 * Every other message is written here, so raw server details never reach the UI.
 */
export function describeApiError(error: unknown): string {
  if (!isApiClientError(error)) {
    return FALLBACK;
  }

  if (error.code === "CONFLICT") {
    return error.message;
  }

  return MESSAGES[error.code] ?? FALLBACK;
}

/** Errors where sending the same request again can succeed. */
export function isRetryableError(error: unknown): boolean {
  return (
    isApiClientError(error) &&
    ["RATE_LIMITED", "AI_PROVIDER_ERROR", "AI_TIMEOUT", "NETWORK_ERROR", "INTERNAL_ERROR"].includes(
      error.code,
    )
  );
}
