"use client";

import { useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { Alert, Button, ErrorState, Field, Input, Textarea, useToast } from "@/components/ui";
import { getAssistantConfig, updateAssistantConfig } from "@/lib/api/admin";
import { isApiClientError } from "@/lib/api/client";
import { describeApiError } from "@/lib/api/errors";
import { redirectToLogin } from "@/lib/api/redirect";
import { useAsyncData } from "@/lib/api/use-async-data";
import type { AssistantConfig } from "@/lib/contracts/admin";
import { formErrorsFromApi, formErrorsFromZod, type FormErrors } from "@/lib/utils/field-errors";
import { formatDateTime, formatNumber } from "@/lib/utils/format";

const SYSTEM_PROMPT_MAX = 20000;

/*
 * Form schema. Limits mirror `assistantConfigInputSchema` in the shared
 * contract; they are restated here to attach messages written for the user
 * and to convert the two numeric fields from text. The backend validates the
 * request again.
 */
const numberFromText = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => Number(value));

const assistantFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80, "Use 80 characters or fewer."),
  systemPrompt: z
    .string()
    .trim()
    .min(1, "Enter a system prompt.")
    .max(SYSTEM_PROMPT_MAX, `Use ${formatNumber(SYSTEM_PROMPT_MAX)} characters or fewer.`),
  model: z.string().trim().min(1, "Enter a model.").max(100, "Use 100 characters or fewer."),
  temperature: numberFromText("Enter a number from 0 to 2.").pipe(
    z.number("Enter a number from 0 to 2.").min(0, "Use 0 or more.").max(2, "Use 2 or less."),
  ),
  maxTokens: numberFromText("Enter a whole number from 1 to 8192.").pipe(
    z
      .number("Enter a whole number from 1 to 8192.")
      .int("Enter a whole number, without decimals.")
      .min(1, "Use 1 or more.")
      .max(8192, "Use 8192 or less."),
  ),
});

type FormValues = Record<keyof z.input<typeof assistantFormSchema>, string>;
type FormField = keyof FormValues;

function toFormValues(config: AssistantConfig): FormValues {
  return {
    name: config.name,
    systemPrompt: config.systemPrompt,
    model: config.model,
    temperature: String(config.temperature),
    maxTokens: String(config.maxTokens),
  };
}

type EditorProps = {
  config: AssistantConfig;
  onSaved: (config: AssistantConfig) => void;
};

function AssistantEditor({ config, onSaved }: EditorProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>(() => toFormValues(config));
  const [errors, setErrors] = useState<FormErrors<FormField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const saved = toFormValues(config);
  const dirty = (Object.keys(saved) as FormField[]).some((field) => values[field] !== saved[field]);

  function update(field: FormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function reset() {
    setValues(saved);
    setErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    const parsed = assistantFormSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(formErrorsFromZod<FormField>(parsed.error));
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    inFlight.current = true;
    setSaving(true);
    setErrors({});
    setFormError(null);

    try {
      const { config: updated } = await updateAssistantConfig(parsed.data);
      setValues(toFormValues(updated));
      onSaved(updated);
      toast({ variant: "success", title: "Configuration saved" });
    } catch (error) {
      if (isApiClientError(error) && error.status === 401) {
        redirectToLogin();
        return;
      }

      if (isApiClientError(error) && error.code === "VALIDATION_ERROR") {
        setErrors(formErrorsFromApi<FormField>(error.fieldErrors));
      }

      setFormError(describeApiError(error));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Alert variant="warning" title="Changes apply to future messages only">
        Replies that already exist in conversations are not regenerated.
      </Alert>

      {formError ? <Alert variant="error" title={formError} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Assistant name" error={errors.name}>
          {(control) => (
            <Input
              {...control}
              name="name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
            />
          )}
        </Field>

        <Field label="Model" hint="Model identifier sent to the AI provider." error={errors.model}>
          {(control) => (
            <Input
              {...control}
              name="model"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              value={values.model}
              onChange={(event) => update("model", event.target.value)}
            />
          )}
        </Field>

        <Field
          label="Temperature"
          hint="From 0 (focused) to 2 (more varied)."
          error={errors.temperature}
        >
          {(control) => (
            <Input
              {...control}
              name="temperature"
              inputMode="decimal"
              autoComplete="off"
              value={values.temperature}
              onChange={(event) => update("temperature", event.target.value)}
            />
          )}
        </Field>

        <Field
          label="Max tokens"
          hint="Longest reply allowed, from 1 to 8192."
          error={errors.maxTokens}
        >
          {(control) => (
            <Input
              {...control}
              name="maxTokens"
              inputMode="numeric"
              autoComplete="off"
              value={values.maxTokens}
              onChange={(event) => update("maxTokens", event.target.value)}
            />
          )}
        </Field>
      </div>

      <Field
        label="System prompt"
        hint={`${formatNumber(values.systemPrompt.length)} of ${formatNumber(SYSTEM_PROMPT_MAX)} characters. Sent to the model before every conversation.`}
        error={errors.systemPrompt}
      >
        {(control) => (
          <Textarea
            {...control}
            name="systemPrompt"
            rows={14}
            spellCheck={false}
            className="max-h-[32rem] font-mono text-[0.8125rem] leading-6"
            value={values.systemPrompt}
            onChange={(event) => update("systemPrompt", event.target.value)}
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-ink-muted">
          Last saved <time dateTime={config.updatedAt}>{formatDateTime(config.updatedAt)}</time>
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!dirty || saving} onClick={reset}>
            Reset
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? "Saving" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Loads the assistant configuration from the backend and lets an ADMIN edit it. */
export function AssistantForm() {
  const config = useAsyncData("assistant-config", (signal) => getAssistantConfig(signal));

  if (config.status === "loading") {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading assistant configuration</span>
        <div className="h-20 animate-pulse rounded-card bg-sunken" />
        <div className="h-64 animate-pulse rounded-card bg-sunken" />
      </div>
    );
  }

  if (config.status === "error") {
    return (
      <ErrorState
        headingLevel="h2"
        title="The assistant configuration could not be loaded"
        description={describeApiError(config.error)}
        onRetry={config.reload}
      />
    );
  }

  return (
    <AssistantEditor
      config={config.data.config}
      onSaved={(updated) => config.setData(() => ({ config: updated }))}
    />
  );
}
