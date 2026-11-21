"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  useToast,
} from "@/components/ui";
import { isApiClientError } from "@/lib/api/client";
import { deleteConversation } from "@/lib/api/conversations";
import { describeApiError } from "@/lib/api/errors";
import { redirectToLogin } from "@/lib/api/redirect";

type DeleteConversationDialogProps = {
  /** The conversation to delete, or null while the dialog is closed. */
  conversation: { id: string; title: string } | null;
  onClose: () => void;
  /** Called after the backend confirms the deletion. */
  onDeleted: (id: string) => void;
};

/** Asks for explicit confirmation before deleting a conversation. */
export function DeleteConversationDialog({
  conversation,
  onClose,
  onDeleted,
}: DeleteConversationDialogProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  async function handleDelete() {
    if (!conversation || deleting) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteConversation(conversation.id);
      toast({ variant: "success", title: "Conversation deleted" });
      onDeleted(conversation.id);
      close();
    } catch (caught) {
      if (isApiClientError(caught) && caught.status === 401) {
        redirectToLogin();
        return;
      }

      // Already gone (deleted in another tab): the result the user wanted.
      if (isApiClientError(caught) && caught.code === "NOT_FOUND") {
        onDeleted(conversation.id);
        close();
        return;
      }

      setError(describeApiError(caught));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={conversation !== null}
      onOpenChange={(open) => {
        // Closing is blocked while the request is in flight.
        if (!open && !deleting) {
          close();
        }
      }}
    >
      <DialogContent
        title="Delete this conversation?"
        description={
          conversation
            ? `"${conversation.title}" and all of its messages will be removed. This cannot be undone.`
            : undefined
        }
      >
        {error ? (
          <DialogBody>
            <Alert variant="error" title="The conversation was not deleted">
              {error}
            </Alert>
          </DialogBody>
        ) : null}
        <DialogFooter>
          <Button variant="secondary" disabled={deleting} onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            {deleting ? "Deleting" : "Delete conversation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
