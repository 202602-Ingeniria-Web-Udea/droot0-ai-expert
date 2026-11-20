import { HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import type { ApiErrorCode, FieldErrors } from "@/lib/contracts/common";

/**
 * Mock Service Worker server for frontend tests.
 *
 * Tests register the handlers they need with `server.use(...)`. Any request
 * without a handler fails the test, so no test can reach a real backend or
 * the AI provider by accident.
 */
export const server = setupServer();

/** Call once at the top of a test file. */
export function installMockServer() {
  beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

/** Absolute URL of an API route in the jsdom origin. */
export function api(path: string) {
  return `http://localhost:3000${path}`;
}

/** Success envelope: `{ data }`. */
export function ok(data: unknown, status = 200) {
  return HttpResponse.json({ data }, { status });
}

/** Error envelope: `{ error: { code, message, fieldErrors? } }`. */
export function fail(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: FieldErrors,
) {
  return HttpResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  );
}
