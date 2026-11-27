"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  Field,
  Input,
  useToast,
} from "@/components/ui";
import { isApiClientError } from "@/lib/api/client";
import { renameConversation } from "@/lib/api/conversations";
import { describeApiError } from "@/lib/api/errors";
import { redirectToLogin } from "@/lib/api/redirect";
import type { ConversationSummary } from "@/lib/contracts/conversations";

const MAX_TITLE_LENGTH = 120;

type ConversationTarget = {
  id: string;
  title: string;
};

type RenameConversationDialogProps = {
  /** The conversation to rename, or null while the dialog is closed. */
  conversation: ConversationTarget | null;
  onClose: () => void;
  /** Called with the saved conversation after a successful rename. */
  onRenamed: (conversation: ConversationSummary) => void;
};

function RenameConversationEditor({
  conversation,
  onClose,
  onRenamed,
}: {
  conversation: ConversationTarget;
  onClose: () => void;
  onRenamed: (conversation: ConversationSummary) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(conversation.title);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextTitle = title.trim();

    if (!nextTitle) {
      setFieldError("Enter a title for the conversation.");
      return;
    }

    if (nextTitle.length > MAX_TITLE_LENGTH) {
      setFieldError(`Titles can have up to ${MAX_TITLE_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    setFieldError(undefined);
    setFormError(null);

    try {
      const result = await renameConversation(conversation.id, nextTitle);
      toast({ variant: "success", title: "Conversation renamed" });
      onRenamed(result.conversation);
      onClose();
    } catch (error) {
      if (isApiClientError(error) && error.status === 401) {
        redirectToLogin();
        return;
      }

      setFormError(describeApiError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent
      title="Rename conversation"
      description="Give this conversation a short, descriptive title."
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogBody>
          {formError ? (
            <Alert variant="error" title="The conversation was not renamed">
              {formError}
            </Alert>
          ) : null}

          <Field label="Conversation title" error={fieldError}>
            {(control) => (
              <Input
                {...control}
                name="title"
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                autoComplete="off"
                onChange={(event) => {
                  setTitle(event.target.value);
                  setFieldError(undefined);
                }}
              />
            )}
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? "Saving" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function RenameConversationDialog({
  conversation,
  onClose,
  onRenamed,
}: RenameConversationDialogProps) {
  return (
    <Dialog
      open={conversation !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      {conversation ? (
        <RenameConversationEditor
          key={conversation.id}
          conversation={conversation}
          onClose={onClose}
          onRenamed={onRenamed}
        />
      ) : null}
    </Dialog>
  );
}
