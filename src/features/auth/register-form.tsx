"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Alert, Button, Field, Input, buttonStyles } from "@/components/ui";
import { register } from "@/lib/api/auth";
import { isApiClientError } from "@/lib/api/client";
import { describeApiError } from "@/lib/api/errors";
import { formErrorsFromApi, formErrorsFromZod, type FormErrors } from "@/lib/utils/field-errors";
import { PasswordInput } from "./password-input";
import { registerFormSchema, type RegisterFormValues } from "./schemas";

type RegisterField = keyof RegisterFormValues;

const EMPTY: RegisterFormValues = { name: "", email: "", password: "", confirmPassword: "" };

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<RegisterFormValues>(EMPTY);
  const [errors, setErrors] = useState<FormErrors<RegisterField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set when the account exists but the email must be confirmed before logging in. */
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const inFlight = useRef(false);

  function update(field: RegisterField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    const parsed = registerFormSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(formErrorsFromZod<RegisterField>(parsed.error));
      setFormError(null);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    try {
      // confirmPassword is a client-side check only; it is never sent.
      const { name, email, password } = parsed.data;
      const result = await register({ name, email, password });

      // The passwords are no longer needed once the account exists.
      setValues(EMPTY);

      if (result.requiresEmailConfirmation) {
        inFlight.current = false;
        setSubmitting(false);
        setConfirmationEmail(result.user.email);
        return;
      }

      router.replace("/chat");
      router.refresh();
    } catch (error) {
      inFlight.current = false;
      setSubmitting(false);

      if (isApiClientError(error) && error.code === "VALIDATION_ERROR") {
        setErrors(formErrorsFromApi<RegisterField>(error.fieldErrors));
      }

      if (isApiClientError(error) && error.code === "CONFLICT") {
        setErrors({ email: "An account with this email already exists." });
        setFormError(null);
        return;
      }

      setFormError(describeApiError(error));
    }
  }

  if (confirmationEmail) {
    return (
      <div className="space-y-5">
        <Alert variant="success" title="Confirm your email to finish">
          We sent a confirmation link to {confirmationEmail}. Open it, then log in.
        </Alert>
        <Link href="/login" className={buttonStyles({ size: "lg", className: "w-full" })}>
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError ? <Alert variant="error" title={formError} /> : null}

      <Field label="Name" error={errors.name}>
        {(control) => (
          <Input
            {...control}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
          />
        )}
      </Field>

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

      <Field label="Password" hint="At least 8 characters." error={errors.password}>
        {(control) => (
          <PasswordInput
            {...control}
            name="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
          />
        )}
      </Field>

      <Field label="Confirm password" error={errors.confirmPassword}>
        {(control) => (
          <PasswordInput
            {...control}
            name="confirmPassword"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(event) => update("confirmPassword", event.target.value)}
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Creating account" : "Create account"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
