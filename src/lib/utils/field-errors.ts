import type { ZodError } from "zod";
import type { FieldErrors } from "@/lib/contracts/common";

/** One message per field, which is what a form shows under each input. */
export type FormErrors<Field extends string = string> = Partial<Record<Field, string>>;

/** Keeps the first client-side validation message of each field. */
export function formErrorsFromZod<Field extends string>(error: ZodError): FormErrors<Field> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "_root");
    errors[field] ??= issue.message;
  }

  return errors as FormErrors<Field>;
}

/** Keeps the first server-side validation message of each field. */
export function formErrorsFromApi<Field extends string>(
  fieldErrors: FieldErrors | undefined,
): FormErrors<Field> {
  const errors: Record<string, string> = {};

  for (const [field, messages] of Object.entries(fieldErrors ?? {})) {
    if (messages[0]) {
      errors[field] = messages[0];
    }
  }

  return errors as FormErrors<Field>;
}
