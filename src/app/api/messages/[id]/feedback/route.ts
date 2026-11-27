import { setMessageFeedbackRequestSchema } from "@/lib/contracts/conversations";
import { uuidSchema } from "@/lib/contracts/common";
import { requireUser } from "@/server/auth/current-user";
import { handleApiError, parseJsonBody } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { assertSameOrigin } from "@/server/http/security";
import { setMessageFeedback } from "@/server/services/conversations";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const { id } = await context.params;
    const messageId = uuidSchema.parse(id);
    const body = await parseJsonBody(request);
    const input = setMessageFeedbackRequestSchema.parse(body);
    const feedback = await setMessageFeedback(user.id, messageId, input.value);

    return jsonOk({ feedback });
  } catch (error) {
    return handleApiError(error);
  }
}
