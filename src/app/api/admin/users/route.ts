import { adminUserListQuerySchema } from "@/lib/contracts/admin";
import { requireAdmin } from "@/server/auth/current-user";
import { handleApiError } from "@/server/http/api-error";
import { jsonOk } from "@/server/http/json";
import { listAdminUsers } from "@/server/services/admin-users";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const query = adminUserListQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });
    const result = await listAdminUsers(query);

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
