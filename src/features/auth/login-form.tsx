"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { login } from "@/lib/api/auth";
import { isApiClientError } from "@/lib/api/client";
import { describeApiError } from "@/lib/api/errors";
import { formErrorsFromApi, formErrorsFromZod, type FormErrors } from "@/lib/utils/field-errors";
import { PasswordInput } from "./password-input";
import { loginFormSchema, type LoginFormValues } from "./schemas";

type LoginField = keyof LoginFormValues;

type LoginFormProps = {
  /** Internal path to open after logging in. Already validated by the page. */
  returnTo: string;
};

export function LoginForm({ returnTo }: LoginFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors<LoginField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // State updates are asynchronous; the ref blocks a second submit immediately.
  const inFlight = useRef(false);

  function update(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    const parsed = loginFormSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(formErrorsFromZod<LoginField>(parsed.error));
      setFormError(null);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    try {
      await login(parsed.data);
      // The password is no longer needed once the session cookie is set.
      setValues((current) => ({ ...current, password: "" }));
      router.replace(returnTo);
      router.refresh();
    } catch (error) {
      inFlight.current = false;
      setSubmitting(false);

      if (isApiClientError(error) && error.code === "VALIDATION_ERROR") {
        setErrors(formErrorsFromApi<LoginField>(error.fieldErrors));
      }

      setFormError(
        isApiClientError(error) && error.code === "UNAUTHENTICATED"
          ? "Incorrect email or password."
          : describeApiError(error),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError ? <Alert variant="error" title={formError} /> : null}

      <Field label="Email" error={errors.email}>
        {(control) => (
          <Input
            {...control}
            type="email"
            name="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
          />
        )}
      </Field>

      <Field label="Password" error={errors.password}>
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Logging in" : "Log in"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
